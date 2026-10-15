"use strict";
// A minimal stand-in for the [v8] object (ported from nnokes/cento), so tests
// can load a bundle the way Max does: as a plain script in its own global
// scope, with no require(), module or exports. If a bundle accidentally
// depends on any of those, loading it here fails.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");

// Max calls a script's global functions by message name, except functions
// marked with .local = 1.
const MAX_GLOBALS = new Set(["outlet", "post", "error", "Dict", "File", "Task", "console"]);

// Stand-in for Max's File: isopen, position, eof (the length; setting it
// truncates), readline(maxchars) without the line ending, readbytes(count),
// writestring, close().
// Max's own File is what M1 checked in [v8]; this one uses the real file system.
class SimFile {
  constructor(file, access = "read") {
    this.isopen = false;
    this.position = 0;
    this.eof = 0;
    this._file = file;
    this._access = access;
    if (access === "write") {
      this._text = "";
      this.isopen = true;
      return;
    }
    try {
      this._bytes = fs.readFileSync(file);
    } catch {
      return;
    }
    // One character per byte, so lines and bytes share one position, and eof
    // is the length in bytes, as in Max.
    this._text = this._bytes.toString("latin1");
    this.isopen = true;
    this.eof = this._bytes.length;
  }
  // Bytes: like Max, an array of numbers.
  readbytes(count) {
    if (!this.isopen || this.position >= this._bytes.length) return null;
    const out = Array.from(this._bytes.subarray(this.position, this.position + count));
    this.position += out.length;
    return out;
  }
  writestring(text) {
    this._text = this._text.slice(0, this.position) + text;
    this.position = this._text.length;
    this.eof = this.position;
  }
  readline(maxchars) {
    if (!this.isopen || this.position >= this.eof) return null;
    let end = this._text.indexOf("\n", this.position);
    if (end < 0) end = this.eof;
    const stop = Math.min(end, this.position + maxchars);
    const line = this._text.slice(this.position, stop);
    this.position = stop < end ? stop : end + 1;
    return line;
  }
  close() {
    if (this.isopen && this._access === "write") fs.writeFileSync(this._file, this._text.slice(0, this.eof));
    this.isopen = false;
  }
}

// Stand-in for Max's Dict: named dictionaries shared by every script, as in Max.
const dictionaries = new Map();
class SimDict {
  constructor(name) {
    this.name = name;
    if (!dictionaries.has(name)) dictionaries.set(name, {});
  }
  parse(json) {
    dictionaries.set(this.name, JSON.parse(json));
  }
  get(key) {
    return dictionaries.get(this.name)[key];
  }
  set(key, ...values) {
    dictionaries.get(this.name)[key] = values.length === 1 ? values[0] : values;
  }
  clear() {
    dictionaries.set(this.name, {});
  }
  stringify() {
    return JSON.stringify(dictionaries.get(this.name));
  }
}

// Stand-in for Max's Task: a function Max's scheduler calls every `interval` ms
// after repeat(), until cancel(). Here the test drives it: tick() runs one call
// of every running task (see loadBundle's tick).
class SimTask {
  constructor(fn, object, ...args) {
    this.fn = fn;
    this.object = object;
    this.args = args;
    this.interval = 0;
    this.running = false;
    this.calls = 0;
  }
  repeat() {
    this.running = true;
  }
  execute() {
    this.calls++;
    this.fn.apply(this.object, this.args);
  }
  cancel() {
    this.running = false;
  }
}

function loadBundle(name) {
  const file = path.join(ROOT, "patchers", name + ".bundle.js");
  const sent = [];
  const posted = []; // what the script printed in the Max window
  const tasks = [];
  class BundleTask extends SimTask {
    constructor(...args) {
      super(...args);
      tasks.push(this);
    }
  }
  const context = {
    outlet: (index, ...atoms) => sent.push([index, ...atoms.flat()]),
    post: (...atoms) => posted.push(atoms.join(" ")),
    error: () => {},
    Dict: SimDict,
    File: SimFile,
    Task: BundleTask,
    console,
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });

  return {
    context,
    posted,
    // Sends a message to the script and returns what came out of its outlets.
    send(message, ...args) {
      if (typeof context[message] !== "function" || context[message].local === 1) {
        throw new Error(`${name}: no message handler for "${message}"`);
      }
      sent.length = 0;
      context[message](...args);
      return sent.slice();
    },
    // Runs the script's Tasks as Max's scheduler would, up to `limit` ticks or
    // until none is running; returns what came out of the outlets meanwhile.
    tick(limit = 10000) {
      sent.length = 0;
      let ticks = 0;
      while (ticks < limit && tasks.some((t) => t.running)) {
        for (const t of tasks) if (t.running) t.execute();
        ticks++;
      }
      return { out: sent.slice(), ticks };
    },
    // The global functions Max would accept as messages.
    handlers() {
      return Object.keys(context)
        .filter((key) => typeof context[key] === "function" && !MAX_GLOBALS.has(key))
        .filter((key) => context[key].local !== 1)
        .sort();
    },
  };
}

module.exports = { loadBundle, SimDict };
