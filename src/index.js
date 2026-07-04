import { PMTiles } from "pmtiles";

const TILE_RE = /^\/tiles\/co\/(\d+)\/(\d+)\/(\d+)\.mvt$/;

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

      try {
        const source = makeR2Source(env.TILES, "co_parcels.pmtiles");
        const pmtiles = new PMTiles(source);

        const tile = await pmtiles.getZxy(z, x, y);
        if (!tile || tile.data.byteLength === 0) {
          return new Response(null, {
            status: 204,
            headers: { "Access-Control-Allow-Origin": "*" },
          });
        }

        return new Response(tile.data, {
          headers: {
            "Content-Type": "application/vnd.mapbox-vector-tile",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=86400",
          },
        });
      } catch (err) {
        console.error(`Tile ${z}/${x}/${y} error:`, err.message);
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    }

    // Apple App Site Association — enables Password AutoFill for Threshold and Prior
    if (url.pathname === '/.well-known/apple-app-site-association') {
      const aasa = {
        webcredentials: {
          apps: [
            'GMAMAXJ88G.app.auaha.threshold',
            'GMAMAXJ88G.app.auaha.prior',
          ],
        },
      };
      return new Response(JSON.stringify(aasa), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Android Digital Asset Links — enables Password AutoFill for Threshold and Prior
    // Replace the SHA256 placeholders with your release keystore fingerprints:
    //   keytool -list -v -keystore your.jks -alias your-alias | grep "SHA256:"
    if (url.pathname === '/.well-known/assetlinks.json') {
      const assetLinks = [
        {
          relation: ['delegate_permission/common.handle_all_urls'],
          target: {
            namespace: 'android_app',
            package_name: 'app.auaha.threshold',
            sha256_cert_fingerprints: [
              'REPLACE_WITH_THRESHOLD_RELEASE_KEYSTORE_SHA256',
            ],
          },
        },
        {
          relation: ['delegate_permission/common.handle_all_urls'],
          target: {
            namespace: 'android_app',
            package_name: 'app.auaha.prior',
            sha256_cert_fingerprints: [
              'REPLACE_WITH_PRIOR_RELEASE_KEYSTORE_SHA256',
            ],
          },
        },
      ];
      return new Response(JSON.stringify(assetLinks), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
