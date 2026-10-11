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
const MAX_GLOBALS = new Set(["outlet", "post", "error", "Dict", "console"]);

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
  const file = path.join(ROOT, "patchers", "scripts", name + ".bundle.js");
  const sent = [];
  const posted = []; // what the script printed in the Max window
  const context = {
    outlet: (index, ...atoms) => sent.push([index, ...atoms.flat()]),
    post: (...atoms) => posted.push(atoms.join(" ")),
    error: () => {},
    Dict: SimDict,
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
