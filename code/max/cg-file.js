"use strict";
// Max-only: reads a text file through Max's File object (M1 checks this works
// in [v8]). The path comes from [opendialog], a full path, so Max's search
// path doesn't matter (PLAN.md 2.2). Tests swap in a stand-in File.

const MAX_LINE = 4096;

// The file's lines, without line endings. Throws if it can't be opened.
function readLines(path) {
  const file = new File(path, "read");
  if (!file.isopen) throw new Error("can't open " + path);
  const lines = [];
  try {
    while (file.position < file.eof) {
      const before = file.position;
      const line = file.readline(MAX_LINE);
      if (line === null || line === undefined) break;
      lines.push(String(line).replace(/[\r\n]+$/, ""));
      if (file.position <= before) break; // never loop on a file that doesn't advance
    }
  } finally {
    file.close();
  }
  return lines;
}

exports.readLines = readLines;
