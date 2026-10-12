// [v8] wrapper for the "hello" smoke test (M0). Glue only: the logic is in code/lib.
// Patches load the bundled copy, patchers/cg.hello.bundle.js (npm run build).
//
// Messages:  bang  -> hello with seed 1
//            int   -> hello with that seed
// Outlet 0:  hello <name> <version> seed <n> check <a> <b> <c> <d> note <midi> <hz>

autowatch = 1;
inlets = 1;
outlets = 1;

const { hello } = require("cg-hello");

function bang() {
  report(1);
}

function msg_int(seed) {
  report(seed);
}

function report(seed) {
  const h = hello(seed);
  outlet(0, "hello", h.name, h.version, "seed", h.seed, "check", ...h.check, "note", h.note.midi, h.note.hz);
}
report.local = 1;
