"use strict";
// Checks every Max patch in patchers/ for mistakes Max only reports when a
// file is opened (ported and adapted from nnokes/cento). Max writes each
// object's real inlet and outlet counts into the file, so these checks stay
// valid for hand-built patches saved from Max as well as generated ones.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const PATCHERS = path.join(ROOT, "patchers");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
const rel = (file) => path.relative(ROOT, file).split(path.sep).join("/");
const files = walk(PATCHERS).filter((f) => f.endsWith(".maxpat")).map(rel).sort();

const readPatcher = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8")).patcher;

// Every patcher in a file, including [p] subpatchers.
function* patchers(patcher, where) {
  yield [patcher, where];
  for (const { box } of patcher.boxes) {
    if (box.patcher) yield* patchers(box.patcher, `${where} > [${box.text}]`);
  }
}

const firstWord = (box) => (box.text || "").split(/\s+/)[0];

// Everything Max loads lives directly in patchers/: on a fresh clone Max finds
// files only in the folder of the patch you open, not in subfolders or by a
// relative path (M0 spike a, PLAN.md 2.2). So every name is bare.
const hasPath = (name) => /[\\/]/.test(name);
const scriptExists = (name) => !hasPath(name) && fs.existsSync(path.join(PATCHERS, name));
const patchExists = (name) => !hasPath(name) && fs.existsSync(path.join(PATCHERS, name));

test("everything Max loads sits directly in patchers/, not in a subfolder", () => {
  const nested = walk(PATCHERS)
    .filter((f) => path.dirname(f) !== PATCHERS)
    .filter((f) => /\.(maxpat|amxd|js)$/.test(f))
    .map(rel);
  assert.deepEqual(nested, []);
});

for (const file of files) {
  test(`${file}: cords, [v8], bpatchers and abstractions`, () => {
    const problems = [];
    for (const [patcher, where] of patchers(readPatcher(file), file)) {
      const boxes = new Map(patcher.boxes.map(({ box }) => [box.id, box]));
      const label = (box) => `[${box.text || box.maxclass}]`;

      for (const { patchline } of patcher.lines) {
        const [srcId, outlet] = patchline.source;
        const [dstId, inlet] = patchline.destination;
        const src = boxes.get(srcId);
        const dst = boxes.get(dstId);
        if (!src || !dst) {
          problems.push(`${where}: cord between missing objects ${srcId} -> ${dstId}`);
          continue;
        }
        if (outlet >= src.numoutlets) problems.push(`${where}: ${label(src)} has no outlet ${outlet}`);
        if (inlet >= dst.numinlets) problems.push(`${where}: ${label(dst)} has no inlet ${inlet}`);
        // Wrappers have one inlet and one outlet (PLAN.md 2.4).
        if (firstWord(src) === "v8" && outlet > 0) problems.push(`${where}: cord from ${label(src)} outlet ${outlet}`);
        if (firstWord(dst) === "v8" && inlet > 0) problems.push(`${where}: cord into ${label(dst)} inlet ${inlet}`);
        // Only an unnamed [receive] has an inlet.
        const words = (dst.text || "").split(/\s+/);
        if ((words[0] === "receive" || words[0] === "r") && words.length > 1) {
          problems.push(`${where}: cord into named ${label(dst)}, which has no inlet`);
        }
      }

      for (const box of boxes.values()) {
        // Every [v8] names an existing bundle in its textfile entry, unembedded,
        // or it loads empty and Max drops its cords (cento, M0).
        if (firstWord(box) === "v8" || box.maxclass === "v8ui") {
          const script = (box.textfile || {}).filename || "";
          if (!/\.bundle\.js$/.test(script) || box.textfile.embed !== 0) {
            problems.push(`${where}: ${label(box)} needs textfile {filename: "<name>.bundle.js", embed: 0}`);
          } else if (hasPath(script)) {
            problems.push(`${where}: ${label(box)} uses a path; Max won't follow it (name the file only)`);
          } else if (!scriptExists(script)) {
            problems.push(`${where}: ${label(box)} names a missing script ${script}`);
          }
        }
        if (box.maxclass === "bpatcher" && hasPath(box.name || "")) {
          problems.push(`${where}: bpatcher ${box.name} uses a path; Max won't follow it`);
        } else if (box.maxclass === "bpatcher" && !patchExists(box.name || "")) {
          problems.push(`${where}: bpatcher names a missing patch ${box.name}`);
        }
        // An abstraction of ours, by bare name: the patch must exist.
        if (box.maxclass === "newobj" && /^cg\./.test(firstWord(box)) && !patchExists(firstWord(box) + ".maxpat")) {
          problems.push(`${where}: ${label(box)} is not a patch in patchers/`);
        }
      }
    }
    assert.deepEqual(problems, []);
  });
}

// ---------------------------------------------------------------- hybrid authoring (PLAN.md 4.4)

const lists = JSON.parse(execFileSync("python3", [path.join(ROOT, "tools", "patchgen.py"), "--list"], { encoding: "utf8" }));
const mentions = (file, note) => JSON.stringify(readPatcher(file)).includes(JSON.stringify(note).slice(1, -1));

test("every patch is either generated or hand-built, never both", () => {
  const generated = new Set(lists.generated);
  const hand = new Set(lists.hand);
  assert.deepEqual(lists.generated.filter((f) => hand.has(f)), []);
  assert.deepEqual(files.filter((f) => !generated.has(f) && !hand.has(f)), [], "patches the generator doesn't know about");
});

test("generated patches carry the generated note; hand-built ones never do", () => {
  for (const file of lists.generated) assert.ok(mentions(file, lists.generated_note), `${file} lacks the generated note`);
  for (const file of lists.hand.filter((f) => fs.existsSync(path.join(ROOT, f)))) {
    assert.ok(!mentions(file, lists.generated_note), `${file} is hand-built but says it's generated`);
  }
});

test("generated patches are up to date with tools/patchgen.py", () => {
  execFileSync("python3", [path.join(ROOT, "tools", "patchgen.py"), "--check"], { encoding: "utf8" });
});

// M0 spike (e): regenerating never touches a hand-built patch. Runs the
// generator in a scratch copy of the repo (it writes next to its own tools/
// folder), so the real patchers/ is never written.
test("regenerating keeps hand-built patches as Max saved them, and only creates missing ones", () => {
  const sandbox = fs.mkdtempSync(path.join(require("os").tmpdir(), "cg-patchgen-"));
  try {
    const tool = path.join(sandbox, "tools", "patchgen.py");
    fs.mkdirSync(path.dirname(tool));
    fs.mkdirSync(path.join(sandbox, "patchers"));
    fs.copyFileSync(path.join(ROOT, "tools", "patchgen.py"), tool);
    const run = (...args) => execFileSync("python3", [tool, ...args], { encoding: "utf8" });
    const read = (file) => fs.readFileSync(path.join(sandbox, file), "utf8");

    // The first hand-built patch has been edited and saved in Max; the rest don't exist yet.
    const [edited, ...missing] = lists.hand;
    const patch = JSON.parse(fs.readFileSync(path.join(ROOT, edited), "utf8"));
    patch.patcher.boxes.push({ box: { id: "obj-edit", maxclass: "comment", text: "my edit", patching_rect: [0, 0, 60, 20] } });
    const saved = JSON.stringify(patch, null, "\t");
    fs.writeFileSync(path.join(sandbox, edited), saved);

    run("--init");
    run("--init");
    run();
    assert.equal(read(edited), saved, `${edited} was overwritten`);
    const handNote = JSON.stringify(lists.hand_note).slice(1, -1);
    for (const file of missing) assert.ok(read(file).includes(handNote), `${file} wasn't created`);
    for (const file of lists.generated) {
      assert.equal(read(file), fs.readFileSync(path.join(ROOT, file), "utf8"), `${file} differs from the repo's`);
    }
    assert.match(run("--check"), /up to date/);
  } finally {
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
});
