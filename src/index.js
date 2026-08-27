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

    const host = url.hostname;
    const path = url.pathname;

    // ── Canonical scheme ────────────────────────────────────────────────────
    // Send http → https once, so Search Console stops seeing an http twin of
    // every page. Guarded on the URL's own scheme, so it can never loop.
    // cf-visitor is a second opinion: if the edge says the visitor already came
    // in over https, never redirect, so a proxy quirk can't produce a loop.
    const visitorIsHttps = (request.headers.get("cf-visitor") || "").includes(
      '"scheme":"https"',
    );
    if (url.protocol === "http:" && !visitorIsHttps) {
      const httpsUrl = new URL(url);
      httpsUrl.protocol = "https:";
      return Response.redirect(httpsUrl.toString(), 301);
    }

    // ── Shoein' brand domain ────────────────────────────────────────────────
    // shoein.app serves the /shoein/* pages at its root. Shared assets
    // (icons, badges, favicons — anything with a file extension) come from the
    // repo root as-is; sitemap.xml/robots.txt come from the /shoein/ tree.
    if (host === "shoein.app" || host === "www.shoein.app") {
      if (path === "/sitemap.xml" || path === "/robots.txt") {
        const u = new URL(url);
        u.pathname = "/shoein" + path;
        return env.ASSETS.fetch(new Request(u, request));
      }
      // Default favicon/touch-icon requests → the Shoein'-branded versions.
      const favMap = {
        "/favicon.ico": "/icons/shoein-favicon.ico",
        "/apple-touch-icon.png": "/icons/shoein-apple-touch.png",
        "/apple-touch-icon-precomposed.png": "/icons/shoein-apple-touch.png",
      };
      if (favMap[path]) {
        const u = new URL(url);
        u.pathname = favMap[path];
        return env.ASSETS.fetch(new Request(u, request));
      }
      if (/\.[a-z0-9]+$/i.test(path)) {
        return env.ASSETS.fetch(request);
      }
      // Enforce a trailing slash on page paths first, so Cloudflare's directory
      // redirect never fires on the internal /shoein/ path and leaks it.
      if (path !== "/" && !path.endsWith("/")) {
        const slashUrl = new URL(url);
        slashUrl.pathname = path + "/";
        return Response.redirect(slashUrl.toString(), 301);
      }
      const u = new URL(url);
      u.pathname = path === "/" ? "/shoein/" : "/shoein" + path;
      return env.ASSETS.fetch(new Request(u, request));
    }

    // Old auaha.app/shoein/* → 301 to the new shoein.app home.
    if (
      (host === "auaha.app" || host === "www.auaha.app") &&
      (path === "/shoein" || path.startsWith("/shoein/"))
    ) {
      let rest = path.replace(/^\/shoein/, "") || "/";
      // Normalize to a trailing slash for page paths (avoids a second hop).
      if (rest !== "/" && !rest.endsWith("/") && !/\.[a-z0-9]+$/i.test(rest)) {
        rest += "/";
      }
      return Response.redirect("https://shoein.app" + rest + url.search, 301);
    }

    // Legacy root-level legal pages (Contact Photos' original store links).
    // These were meta-refresh stubs; a 301 consolidates them properly.
    const LEGACY_LEGAL = new Map([
      ["/privacy", "/contactphotos/privacy/"],
      ["/terms", "/contactphotos/terms/"],
    ]);
    const legacyTarget = LEGACY_LEGAL.get(path.replace(/\/$/, ""));
    if (legacyTarget) {
      return Response.redirect(
        "https://auaha.app" + legacyTarget + url.search,
        301,
      );
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
            'GMAMAXJ88G.app.auaha.functionalparenting',
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
        {
          relation: ['delegate_permission/common.handle_all_urls'],
          target: {
            namespace: 'android_app',
            package_name: 'app.auaha.functionalparenting',
            sha256_cert_fingerprints: [
              'E1:86:9C:1F:6F:07:F6:9B:67:41:45:40:F2:21:7A:E8:C3:D9:AD:94:CD:B6:D8:E6:42:02:9F:76:5C:FB:44:27',
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

    // Enforce a trailing slash on page paths with our own 301. Cloudflare's
    // asset layer would do this with a 307, which Search Console reports as a
    // temporary "Page with redirect" and consolidates less cleanly.
    if (
      path !== "/" &&
      !path.endsWith("/") &&
      !path.startsWith("/.well-known/") &&
      !/\.[a-z0-9]+$/i.test(path)
    ) {
      const slashUrl = new URL(url);
      slashUrl.pathname = path + "/";
      return Response.redirect(slashUrl.toString(), 301);
    }

    return env.ASSETS.fetch(request);
  },
};
