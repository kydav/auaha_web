import { PMTiles, TileType } from "@protomaps/pmtiles";

// Serve tile requests from R2-backed PMTiles; everything else falls through to static assets.
// Tile URL pattern: /tiles/co/{z}/{x}/{y}.mvt

const TILE_RE = /^\/tiles\/co\/(\d+)\/(\d+)\/(\d+)\.mvt$/;

function makeR2Source(bucket, key) {
  return {
    getBytes: async (offset, length) => {
      const obj = await bucket.get(key, { range: { offset, length } });
      if (!obj) throw new Error(`R2 object not found: ${key}`);
      const data = new Uint8Array(await obj.arrayBuffer());
      return { data };
    },
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
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

      const header = await pmtiles.getHeader();
      const tile = await pmtiles.getZxy(z, x, y);
      if (!tile || tile.data.byteLength === 0) {
        return new Response(null, { status: 204 });
      }

      const headers = {
        "Content-Type": header.tileType === TileType.Mvt
          ? "application/vnd.mapbox-vector-tile"
          : "application/x-protobuf",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400",
      };
      // Tiles stored with gzip compression; let the client decompress.
      if (header.internalCompression === 2) headers["Content-Encoding"] = "gzip";

      return new Response(tile.data, { headers });
    }

    // Fall through to static assets
    return env.ASSETS.fetch(request);
  },
};
