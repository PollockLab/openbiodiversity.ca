// Builds public/sdm-species.json from the bucket manifest (2.9 MB uncompressed, so the browser never fetches it).
// Usage: node scripts/sdm-species-index.mjs [local-manifest.json]
import { readFile, writeFile } from 'node:fs/promises';

const URL = 'https://object-arbutus.alliancecan.ca/swift/v1/4903c6264e0c4191a74a54c93b6fe1d9/def-pollock-eckert/vertebrates_NA/ECCC_2026/manifest.json';
const OUT = new globalThis.URL('../public/sdm-species.json', import.meta.url);
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
  await writeFile(OUT, JSON.stringify(rows));
  console.log(`wrote ${rows.length} species to public/sdm-species.json`);
} catch (err) {
  console.error(`sdm-species-index: ${err.message}`);
  process.exit(1);
}
