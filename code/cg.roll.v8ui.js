// [v8ui] piano roll (M3 part F; PLAN.md 4.1). Glue only: what goes where is
// cg-roll's layout, and this draws it. It shows what the canon panel renders
// and plays: each voice's notes in its colour, the analysis's violation
// markers (red: a fault; amber: a soft rule), and the dissonance curve. It
// reads the dicts cg.events and cg.report, which the canon wrapper writes on
// every render, then sends roll rendered. It also reads them once when the
// script loads, so a roll opened after a render shows it at once.
//
// Messages            Outlet 0
//   rendered                               read cg.events and cg.report again, and redraw
//   playhead <i>                           a line at event i's time (the player's index); -1 hides it
//   clear                                  show nothing
//   (a click on a marker)  status <text>   the marker's rule, also shown in the caption
// Errors: error <message> from a message; a drawing error is posted to the Max
// window and shown in the caption.
// The layout is worked out once per render (or resize), not once per note: the
// playhead is drawn over it.
// No global function here may share a name with a Max built-in: jsui's
// refresh(), for one (M3 session 2: the roll drew nothing while this script
// defined refresh). A test checks every wrapper.

autowatch = 1;
inlets = 1;
outlets = 1;
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

const roll = require("cg-roll");

// Named dicts live only while something holds them (M3 session 1): held for
// the script's whole life.
const eventsDict = new Dict("cg.events"); // written by the canon wrapper
const reportDict = new Dict("cg.report"); // written by the canon wrapper

let view = { events: [] };
let caption = null; // a clicked marker's text (or a drawing error), until the next render
let playheadT = null; // beats, or null
let cache = null; // { width, height, items, markers, frame }

function attempt(action) {
  try {
    action();
  } catch (e) {
    outlet(0, "error", String(e && e.message ? e.message : e));
  }
}
attempt.local = 1;

function readDict(dict) {
  const text = dict.stringify();
  const value = text ? JSON.parse(text) : null;
  return value && Object.keys(value).length ? value : null;
}
readDict.local = 1;

// The canon now in the dicts (none yet: an empty roll).
function loadDicts() {
  const played = readDict(eventsDict);
  const report = readDict(reportDict);
  view = {
    name: played ? played.name : "",
    voices: played && played.voices ? played.voices : [],
    events: played && played.events ? played.events.map(([t, dur, pitch, , voice]) => ({ t, dur, pitch, voice })) : [],
    meter: report ? report.meter : undefined,
    period: report ? report.period : undefined,
    report,
  };
  caption = null;
  playheadT = null;
  cache = null;
}
loadDicts.local = 1;

function rendered() {
  attempt(loadDicts);
  mgraphics.redraw();
}

function playhead(index) {
  attempt(() => {
    const e = view.events[index];
    playheadT = index >= 0 && e ? e.t : null;
  });
  mgraphics.redraw();
}

function clear() {
  view = { events: [] };
  caption = null;
  playheadT = null;
  cache = null;
  mgraphics.redraw();
}

function paint() {
  try {
    const [width, height] = boxSize();
    if (!cache || cache.width !== width || cache.height !== height) {
      cache = { width, height, ...roll.layout({ ...view, caption }, { width, height }) };
    }
    for (const item of cache.items) drawItem(item);
    if (playheadT !== null && cache.frame) drawItem(roll.playheadLine(cache.frame, playheadT));
  } catch (e) {
    const message = String(e && e.message ? e.message : e);
    post("roll: " + message + "\n");
    cache = null;
    const g = mgraphics;
    g.set_source_rgba(0.85, 0.12, 0.12, 1);
    g.select_font_face("Arial");
    g.set_font_size(11);
    g.move_to(4, 13);
    g.show_text("roll: " + message);
  }
}

function onclick(x, y) {
  const text = cache ? roll.hit(cache.markers, x, y) : null;
  if (!text) return;
  caption = text;
  cache = null;
  outlet(0, "status", text);
  mgraphics.redraw();
}

function onresize() {
  cache = null;
  mgraphics.redraw();
}

// The box's size: mgraphics.size, or the box's rect where that's missing (as
// in nnokes/cento's piano roll).
function boxSize() {
  if (mgraphics.size) return mgraphics.size;
  const rect = box.rect;
  return [rect[2] - rect[0], rect[3] - rect[1]];
}
boxSize.local = 1;

function drawItem(item) {
  const g = mgraphics;
  g.set_source_rgba(item.color[0], item.color[1], item.color[2], item.color[3]);
  if (item.op === "rect") {
    g.rectangle(item.x, item.y, item.w, item.h);
    g.fill();
  } else if (item.op === "line") {
    g.set_line_width(item.width);
    g.move_to(item.x1, item.y1);
    g.line_to(item.x2, item.y2);
    g.stroke();
  } else if (item.op === "path") {
    g.set_line_width(item.width);
    item.points.forEach(([px, py], i) => (i ? g.line_to(px, py) : g.move_to(px, py)));
    g.stroke();
  } else if (item.op === "diamond") {
    g.move_to(item.x, item.y - item.r);
    g.line_to(item.x + item.r, item.y);
    g.line_to(item.x, item.y + item.r);
    g.line_to(item.x - item.r, item.y);
    g.close_path();
    g.fill();
  } else if (item.op === "text") {
    g.select_font_face("Arial");
    g.set_font_size(item.size);
    g.move_to(item.x, item.y);
    g.show_text(item.text);
  }
}
drawItem.local = 1;

// Whatever the canon panel rendered before this script loaded.
attempt(loadDicts);
