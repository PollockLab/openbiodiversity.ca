// Builds public/sdm-species.json from the bucket manifest (2.9 MB uncompressed, so the browser never fetches it).
// Usage: node scripts/sdm-species-index.mjs [local-manifest.json]
import { readFile, writeFile } from 'node:fs/promises';

const CACHE = new globalThis.URL('./.gbif-cache.json', import.meta.url);
const ITIS = 'Integrated Taxonomic Information System';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cap = (s) => (s === s.toLowerCase() ? s.replace(/(^|[\s-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase()) : s);

// ITIS first, else case-insensitive majority vote (most common casing wins)
function pick(names, lang) {
  const l = names.filter((n) => n.language === lang && n.vernacularName?.trim());
  const itis = l.find((n) => n.source?.includes(ITIS));
  if (itis) return cap(itis.vernacularName.trim());
  const votes = new Map();
  for (const n of l) {
    const v = n.vernacularName.trim(), k = v.toLowerCase();
    const e = votes.get(k) ?? { n: 0, cases: new Map() };
    e.n++; e.cases.set(v, (e.cases.get(v) ?? 0) + 1);
    votes.set(k, e);
  }
  const best = [...votes.values()].sort((a, b) => b.n - a.n)[0];
  return best && cap([...best.cases].sort((a, b) => b[1] - a[1])[0][0]);
}

async function vernacular(key) {
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(`https://api.gbif.org/v1/species/${key}/vernacularNames?limit=1000`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()).results.map(({ vernacularName, language, source }) => ({ vernacularName, language, source }));
    } catch (e) {
      if (i >= 3) throw e;
      await sleep(500 * 2 ** i);
    }
  }
}

const URL = 'https://object-arbutus.alliancecan.ca/swift/v1/4903c6264e0c4191a74a54c93b6fe1d9/def-pollock-eckert/vertebrates_NA/ECCC_2026/manifest.json';
const OUT = new globalThis.URL('../public/sdm-species.json', import.meta.url);
// Species with no GBIF record in Canada or the US (from find-non-ca-us-species.py) are not listed
const NON_CA_US = new globalThis.URL('./non-ca-us-species.json', import.meta.url);
const first = (v) => (Array.isArray(v) ? v[0] : v);
const clean = (v) => { const s = String(first(v) ?? '').trim(); return s === '' || s === 'NA' ? undefined : s; };

try {
  const src = process.argv[2];
  const manifest = JSON.parse(src ? await readFile(src, 'utf8') : await (async () => {
    const r = await fetch(URL);
    if (!r.ok) throw new Error(`manifest fetch failed: HTTP ${r.status}`);
    return r.text();
  })());
  const entries = Object.entries(manifest);
  if (entries.length === 0) throw new Error('manifest has zero entries');
  const rows = entries.map(([slug, e]) => {
    const sci = clean(e.Species), cls = clean(e.Class);
    if (!sci || !cls) throw new Error(`entry "${slug}" lacks Species or Class`);
    return { slug, sci, common: clean(e['IUCN.Common.Name']), class: cls, status: clean(e['IUCN.Status']) };
  }).sort((a, b) => a.sci.localeCompare(b.sci));

  const cache = await readFile(CACHE, 'utf8').then(JSON.parse, () => ({}));
  // Some species list several GBIF keys and the first can lack names (gulo-gulo), so fall through them in order
  const keysOf = (e) => String(first(e['GBIF.IDs']) ?? '').split('~').map(clean).filter(Boolean);
  const keys = new Map(entries.map(([slug, e]) => [slug, keysOf(e)]));
  const todo = [...new Set([...keys.values()].flat())].filter((k) => !(k in cache));
  const failed = new Map();
  let next = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (next < todo.length) {
      const k = todo[next++];
      try { cache[k] = await vernacular(k); } catch (e) { failed.set(k, e.message); }
    }
  }));
  await writeFile(CACHE, JSON.stringify(cache));
  let kept = 0, failSpecies = 0;
  for (const r of rows) {
    const ks = keys.get(r.slug), got = ks.filter((k) => cache[k]);
    if (ks.length && !got.length) failSpecies++;
    const firstPick = (lang) => got.map((k) => pick(cache[k], lang)).find(Boolean);
    const en = firstPick('eng');
    if (!en && r.common) kept++;
    r.common = en ?? r.common;
    const fr = firstPick('fra');
    if (fr) r.fr = fr[0].toUpperCase() + fr.slice(1);
  }
  if (failed.size) console.error(`GBIF fetch failed for ${failed.size} keys (${failSpecies} species): ${[...new Set(failed.values())].join('; ')}`);
  if (failSpecies > rows.length * 0.05) throw new Error(`${failSpecies}/${rows.length} species failed GBIF fetch (>5%)`);
  const nonCaUs = new Set(JSON.parse(await readFile(NON_CA_US, 'utf8')));
  const listed = rows.filter((r) => !nonCaUs.has(r.slug));
  await writeFile(OUT, JSON.stringify(listed));
  console.log(`wrote ${listed.length} species to public/sdm-species.json (en ${rows.filter((r) => r.common).length}, fr ${rows.filter((r) => r.fr).length}, kept manifest name ${kept}, fetch failures ${failSpecies})`);
} catch (err) {
  console.error(`sdm-species-index: ${err.message}`);
  process.exit(1);
}
