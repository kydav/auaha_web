import { PMTiles } from "pmtiles";

// Serve tile requests from R2-backed PMTiles; everything else falls through to static assets.
// Tile URL pattern: /tiles/co/{z}/{x}/{y}.mvt

const TILE_RE = /^\/tiles\/co\/(\d+)\/(\d+)\/(\d+)\.mvt$/;

// pmtiles v4 requires a source with getKey() + getBytes(offset, length).
// getZxy() automatically decompresses tile data before returning it.
function makeR2Source(bucket, key) {
  return {
    getKey: () => key,
    getBytes: async (offset, length) => {
      const obj = await bucket.get(key, { range: { offset, length } });
      if (!obj) throw new Error(`R2 object not found: ${key}`);
      return { data: await obj.arrayBuffer() };
    },
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const match = url.pathname.match(TILE_RE);
    if (match) {
      const z = parseInt(match[1], 10);
      const x = parseInt(match[2], 10);
      const y = parseInt(match[3], 10);

      const source = makeR2Source(env.TILES, "co_parcels.pmtiles");
      const pmtiles = new PMTiles(source);

      // getZxy() returns already-decompressed MVT bytes — do NOT set Content-Encoding.
      const tile = await pmtiles.getZxy(z, x, y);
      if (!tile || tile.data.byteLength === 0) {
        return new Response(null, { status: 204 });
      }

      return new Response(tile.data, {
        headers: {
          "Content-Type": "application/vnd.mapbox-vector-tile",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
