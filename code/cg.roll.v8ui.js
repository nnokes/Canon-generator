// [v8ui] piano roll (M3 part F; PLAN.md 4.1). Glue only: what goes where is
// cg-roll's layout, and this draws it. It shows what the canon panel renders
// and plays: each voice's notes in its colour, the analysis's violation
// markers (red: a fault; amber: a soft rule), and the dissonance curve. It
// reads the dicts cg.events and cg.report, which the canon wrapper writes on
// every render, then sends roll refresh.
//
// Messages            Outlet 0
//   refresh                                read cg.events and cg.report again, and redraw
//   playhead <i>                           a line at event i's time (the player's index); -1 hides it
//   clear                                  show nothing
//   (a click on a marker)  status <text>   the marker's rule, also shown in the caption
// The layout is worked out once per render (or resize), not once per note: the
// playhead is drawn over it.

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
let caption = null; // a clicked marker's text, until the next refresh
let playheadT = null; // beats, or null
let cache = null; // { width, height, items, markers, frame }

function read(dict) {
  const text = dict.stringify();
  return text ? JSON.parse(text) : null;
}
read.local = 1;

function refresh() {
  const rendered = read(eventsDict);
  const report = read(reportDict);
  view = {
    name: rendered ? rendered.name : "",
    voices: rendered ? rendered.voices : [],
    events: rendered ? rendered.events.map(([t, dur, pitch, , voice]) => ({ t, dur, pitch, voice })) : [],
    meter: report ? report.meter : undefined,
    period: report ? report.period : undefined,
    report,
  };
  caption = null;
  playheadT = null;
  cache = null;
  mgraphics.redraw();
}

function playhead(index) {
  const e = view.events[index];
  playheadT = index >= 0 && e ? e.t : null;
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
  const [width, height] = size();
  if (!cache || cache.width !== width || cache.height !== height) {
    cache = { width, height, ...roll.layout({ ...view, caption }, { width, height }) };
  }
  for (const item of cache.items) draw(item);
  if (playheadT !== null && cache.frame) draw(roll.playheadLine(cache.frame, playheadT));
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
function size() {
  if (mgraphics.size) return mgraphics.size;
  const rect = box.rect;
  return [rect[2] - rect[0], rect[3] - rect[1]];
}
size.local = 1;

function draw(item) {
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
draw.local = 1;
