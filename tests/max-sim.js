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
const MAX_GLOBALS = new Set(["outlet", "post", "error", "Dict", "File", "console"]);

// Stand-in for Max's File: isopen, position, eof (the length; setting it
// truncates), readline(maxchars) without the line ending, writestring, close().
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
      this._text = fs.readFileSync(file, "utf8");
    } catch {
      return;
    }
    this.isopen = true;
    this.eof = this._text.length;
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

function loadBundle(name) {
  const file = path.join(ROOT, "patchers", name + ".bundle.js");
  const sent = [];
  const posted = []; // what the script printed in the Max window
  const context = {
    outlet: (index, ...atoms) => sent.push([index, ...atoms.flat()]),
    post: (...atoms) => posted.push(atoms.join(" ")),
    error: () => {},
    Dict: SimDict,
    File: SimFile,
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
