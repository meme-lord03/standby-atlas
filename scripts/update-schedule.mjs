// Refreshes data/schedule.json with Southwest's nonstop counts for every AUS route.
// Runs daily from GitHub Actions. Reads FlightsFrom.com route pages politely (one request per second).
// If a page can't be read, the previous value for that route is kept.
import { readFile, writeFile } from "node:fs/promises";

const CODES = "ABQ AMA DAL ELP HRL HOU LBB MAF OKC TUL PHX LAS BUR LGB LAX ONT SNA SAN OAK SFO SJC SMF SEA PDX PSP RNO STS DEN SLC BZN HDN MTJ MDW CVG CMH IND MCI MKE MSP STL OMA DTW ATL MEM BNA MSY RDU CHS TYS SAV FLL JAX MIA MCO TPA RSW ECP PNS VPS SRQ BWI BOS PIT DCA CUN SJD PVR LIR SJO NAS PUJ SJU".split(" ");
const FILE = new URL("../data/schedule.json", import.meta.url);
const sleep = ms => new Promise(r => setTimeout(r, ms));

function toText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&ndash;|&#8211;/g, "–").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#39;/g, "'")
    .replace(/\s+/g, " ");
}

// Returns e.g. "1–4/d", "3/w Begins in 2027-06-05", "? Begins in 2027-03-11", "?" or null if unreadable.
function parse(text) {
  const i = text.indexOf("Airlines with direct flights");
  if (i < 0) return null;
  const seg = text.slice(i, i + 3000);
  const j = seg.indexOf("Southwest Airlines");
  if (j < 0) return "none";
  const s = seg.slice(j + 18);
  const own = s.indexOf("S M T W T F S");
  const next = own < 0 ? -1 : s.indexOf("S M T W T F S", own + 13);
  const block = next < 0 ? s.slice(0, 400) : s.slice(0, next);
  const m = block.match(/(\d+(?:–\d+)?)\s+(daily|weekly) flights?/);
  const begins = (block.slice(0, m ? m.index : block.length).match(/Begins in \d{4}-\d{2}-\d{2}/) || [])[0];
  const count = m ? m[1] + (m[2] === "daily" ? "/d" : "/w") : "?";
  return count + (begins ? " " + begins : "");
}

async function get(route) {
  try {
    const r = await fetch("https://www.flightsfrom.com/" + route, {
      headers: { "User-Agent": "aus-standby-atlas schedule refresh (personal, once daily)" }
    });
    if (!r.ok) return null;
    return parse(toText(await r.text()));
  } catch { return null; }
}

const prev = JSON.parse(await readFile(FILE, "utf8"));
const routes = structuredClone(prev.routes || {});
let read = 0, changed = 0;
for (const c of CODES) {
  for (const [k, route] of [["o", "AUS-" + c], ["b", c + "-AUS"]]) {
    const v = await get(route);
    await sleep(1000);
    if (v == null) continue;           // couldn't read: keep the old value
    read++;
    const val = v === "none" ? "?" : v; // Southwest not listed: off the schedule
    routes[c] = routes[c] || {};
    if (routes[c][k] !== val) { routes[c][k] = val; changed++; }
  }
}
// Only publish if most pages were readable, so a site change can't wipe the data.
if (read < CODES.length * 2 * 0.7) {
  console.error(`Only read ${read} of ${CODES.length * 2} routes; keeping the previous file.`);
  process.exit(1);
}
const now = new Date();
const mon = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const out = {
  checked: now.toISOString().slice(0, 10),
  checkedLabel: `${mon[now.getUTCMonth()]} ${now.getUTCDate()}, ${now.getUTCFullYear()}`,
  source: "flightsfrom.com",
  routes
};
await writeFile(FILE, JSON.stringify(out, null, 0) + "\n");
console.log(`Read ${read} routes, ${changed} changed.`);
