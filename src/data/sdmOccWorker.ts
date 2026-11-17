import { fetchLaeaFgb, markInsideRange } from './sdmRange';

// Off the main thread: the robin has 760k records in an 81 MB file, so the download, parse and range test take seconds.
// The result goes back as a Blob for the map's own worker to read, so the main thread never holds the records.
self.onmessage = async ({ data: { occUrl, rangeUrl, maskUrl } }: MessageEvent<{ occUrl: string; rangeUrl: string; maskUrl: string }>) => {
  try {
    const all = await fetchLaeaFgb(occUrl);
    const mask: GeoJSON.FeatureCollection = await (await fetch(maskUrl)).json();
    // Records outside the expert range are what widen the clip; without a range, points stay uncolored
    const points = { ...all, features: markInsideRange(all, mask).features.filter((f) => !f.properties?.inside) };
    const range = await fetchLaeaFgb(rangeUrl).catch(() => null);
    self.postMessage(new Blob([JSON.stringify(range ? markInsideRange(points, range) : points)]));
  } catch (e) {
    self.postMessage(String(e));
  }
};
