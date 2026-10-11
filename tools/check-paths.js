#!/usr/bin/env node
"use strict";
// Fails if a tracked Max, JS, JSON or Python file contains an absolute path
// from someone's machine. Max sometimes saves these into patchers (file
// references, [vst~] plugin state), and this repository is public.
// Runs in CI and in the pre-commit hook (npm run hooks).

const fs = require("fs");
const { execFileSync } = require("child_process");

// Built from pieces so this file doesn't match itself.
const PATTERNS = [
  ["macOS home folder", new RegExp("/" + "Users" + "/[^/\\s\"']+")],
  ["Windows home folder", new RegExp("[A-Za-z]:\\\\" + "Users" + "\\\\", "i")],
  ["Linux home folder", new RegExp("/" + "home" + "/[^/\\s\"']+/")],
];
const EXTENSIONS = [".maxpat", ".amxd", ".maxproj", ".maxhelp", ".json", ".js", ".py"];

const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter((file) => EXTENSIONS.some((ext) => file.endsWith(ext)))
  .filter((file) => fs.existsSync(file));

const problems = [];
for (const file of files) {
  const lines = fs.readFileSync(file, "latin1").split("\n");
  lines.forEach((line, index) => {
    for (const [label, pattern] of PATTERNS) {
      const match = line.match(pattern);
      if (match) problems.push(`${file}:${index + 1}: ${label} path "${match[0]}"`);
    }
  });
}

if (problems.length) {
  for (const problem of problems) console.error(problem);
  console.error("Remove machine-specific paths before committing (see PLAN.md, section 2.2).");
  process.exit(1);
}
console.log(`no personal paths in ${files.length} files`);
