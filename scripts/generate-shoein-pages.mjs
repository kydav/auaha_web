#!/usr/bin/env node
// Generates SEO landing pages for Shoein', one per farrier/horseshoeing topic,
// each driving traffic to the /shoein/ app page. Edit scripts/shoein-topics.json,
// then run:  npm run gen:shoein
//
// Plain static HTML served from the Cloudflare edge — fully crawlable, no build
// step, no client JS. Sitemap entries are emitted by generate-state-pages.mjs
// (it imports this topics file), so run `npm run gen` to refresh everything.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const data = JSON.parse(
  readFileSync(resolve(__dirname, "shoein-topics.json"), "utf8")
);

const SITE = data.site.replace(/\/$/, "");

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const STYLE = `
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--bg:#1a1613;--surface:#221c17;--card:#2a231c;--accent:#e08521;--accent2:#fbbf24;--text:#f7f4ef;--muted:#b9ab98;--border:#3a3129}
    html{scroll-behavior:smooth}
    body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);line-height:1.6}
    a{color:var(--accent)}
    nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;justify-content:space-between;align-items:center;padding:1rem 2rem;background:rgba(26,22,19,.85);backdrop-filter:blur(12px);border-bottom:1px solid var(--border)}
    .logo{font-size:1.4rem;font-weight:700;letter-spacing:-.5px;color:var(--text);text-decoration:none}
    .logo span{color:var(--accent)}
    .nav-links{display:flex;align-items:center;gap:1.5rem;list-style:none}
    .nav-links a{color:var(--muted);text-decoration:none;font-size:.9rem;transition:color .2s}
    .nav-links a:hover{color:var(--accent)}
    .container{max-width:820px;margin:0 auto;padding:0 1.5rem}
    .breadcrumb{font-size:.82rem;color:var(--muted);padding-top:6.5rem}
    .breadcrumb a{color:var(--muted);text-decoration:none}
    .breadcrumb a:hover{color:var(--accent)}
    .hero{padding:1.5rem 0 2.5rem}
    .badge{display:inline-block;background:rgba(224,133,33,.12);color:var(--accent);border:1px solid rgba(224,133,33,.30);border-radius:99px;padding:.3rem 1rem;font-size:.82rem;font-weight:600;letter-spacing:.5px;text-transform:uppercase;margin-bottom:1.25rem}
    h1{font-size:clamp(2rem,5vw,3rem);font-weight:800;line-height:1.12;letter-spacing:-1px;margin-bottom:1.1rem}
    h1 span{background:linear-gradient(135deg,var(--accent2),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .lede{font-size:1.12rem;color:var(--muted);margin-bottom:1.75rem}
    .hero-cta{display:inline-flex;align-items:center;gap:.6rem;background:var(--accent);color:#fff;padding:.7rem 1.3rem;border-radius:10px;font-weight:700;font-size:.95rem;text-decoration:none;transition:all .2s}
    .hero-cta:hover{background:#c9741a;transform:translateY(-1px)}
    section.block{padding:2.5rem 0;border-top:1px solid var(--border)}
    h2{font-size:clamp(1.5rem,3vw,2rem);font-weight:800;letter-spacing:-.5px;margin-bottom:1rem}
    p{color:var(--muted)}
    .block p+p{margin-top:1rem}
    ul.checks{list-style:none;margin-top:1rem}
    ul.checks li{position:relative;padding-left:1.9rem;margin-bottom:.85rem;color:var(--muted)}
    ul.checks li::before{content:'✓';position:absolute;left:0;top:0;color:var(--accent);font-weight:800}
    ul.checks li b{color:var(--text);font-weight:600}
    .faq-item{border:1px solid var(--border);border-radius:12px;padding:1.25rem 1.4rem;margin-bottom:1rem;background:var(--card)}
    .faq-item h3{margin-bottom:.5rem;font-size:1.05rem;font-weight:700}
    .faq-item p{font-size:.97rem}
    .cta{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:2.5rem 2rem;text-align:center;margin:2.5rem 0;position:relative;overflow:hidden}
    .cta::before{content:'';position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(224,133,33,.10) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none}
    .cta h2{margin-bottom:.6rem}
    .cta p{max-width:440px;margin:0 auto 1.5rem}
    .cta-btn{display:inline-flex;align-items:center;gap:.5rem;background:var(--accent);color:#fff;padding:.8rem 1.5rem;border-radius:10px;font-weight:700;text-decoration:none;transition:all .2s}
    .cta-btn:hover{background:#c9741a;transform:translateY(-2px)}
    .cta-note{font-size:.8rem;color:var(--muted);margin-top:1rem}
    .related{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1rem}
    .related a{display:inline-block;padding:.55rem 1.1rem;border:1px solid var(--border);border-radius:10px;color:var(--text);text-decoration:none;font-size:.92rem;font-weight:600;transition:all .2s;background:rgba(255,255,255,.03)}
    .related a:hover{border-color:var(--accent);color:var(--accent)}
    .disclaimer{font-size:.8rem;color:var(--muted);border-top:1px solid var(--border);padding:1.75rem 0;line-height:1.5}
    footer{border-top:1px solid var(--border);padding:2rem 1.5rem;text-align:center;color:var(--muted);font-size:.875rem}
    footer a{color:var(--accent);text-decoration:none}
    footer a:hover{text-decoration:underline}
    @media(max-width:600px){.nav-links{display:none}}`;

function sectionHtml(sec) {
  if (sec.checks) {
    const items = sec.checks
      .map((c) => `        <li><b>${esc(c.b)}</b> ${esc(c.t)}</li>`)
      .join("\n");
    return `    <section class="block">
      <h2>${esc(sec.h2)}</h2>
      <ul class="checks">
${items}
      </ul>
    </section>`;
  }
  const paras = (sec.body || [])
    .map((p) => `      <p>${esc(p)}</p>`)
    .join("\n");
  return `    <section class="block">
      <h2>${esc(sec.h2)}</h2>
${paras}
    </section>`;
}

function related(current) {
  return data.topics
    .filter((t) => t.slug !== current.slug)
    .slice(0, 6)
    .map(
      (t) =>
        `<a href="/shoein/${t.slug}/">${esc(t.metaTitle.replace(/[:—].*$/, "").trim())}</a>`
    )
    .join("\n        ");
}

function jsonLd(topic, url) {
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: topic.metaTitle,
    description: topic.metaDescription,
    about: topic.keyword,
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: "Auaha App Development LLC" },
    publisher: { "@type": "Organization", name: "Shoein'" },
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: topic.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Shoein'",
    applicationCategory: "BusinessApplication",
    operatingSystem: "iOS, Android",
    description:
      "Shoein' keeps every farrier client and horse in one place — addresses on a map, one-tap call, text, and directions, and last-service tracking so you never miss a cycle.",
    url: `${SITE}/shoein/`,
  };
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Shoein'", item: `${SITE}/shoein/` },
      { "@type": "ListItem", position: 3, name: topic.metaTitle, item: url },
    ],
  };
  return [article, faq, software, crumbs]
    .map(
      (o) =>
        `  <script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n  </script>`
    )
    .join("\n");
}

function page(topic) {
  const url = `${SITE}/shoein/${topic.slug}/`;
  const title = `${topic.metaTitle} | Shoein'`;
  const desc = topic.metaDescription;

  const sections = topic.sections.map(sectionHtml).join("\n\n");
  const faqHtml = topic.faqs
    .map(
      (f) => `      <div class="faq-item">
        <h3>${esc(f.q)}</h3>
        <p>${esc(f.a)}</p>
      </div>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/x-icon" href="/favicon.ico" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${url}" />
  <meta name="robots" content="index, follow" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:site_name" content="Shoein'" />
  <meta property="og:image" content="${SITE}/apple-touch-icon.png" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
${jsonLd(topic, url)}
  <style>${STYLE}
  </style>
</head>

<body>

  <nav>
    <a href="/" class="logo">Auaha<span>.</span></a>
    <ul class="nav-links">
      <li><a href="/shoein/">Shoein'</a></li>
      <li><a href="/shoein/support">Support</a></li>
      <li><a href="/shoein/privacy">Privacy</a></li>
    </ul>
  </nav>

  <main class="container">
    <p class="breadcrumb">
      <a href="/">Home</a> &nbsp;›&nbsp; <a href="/shoein/">Shoein'</a> &nbsp;›&nbsp; ${esc(topic.metaTitle)}
    </p>

    <section class="hero">
      <div class="badge">${esc(topic.badge)}</div>
      <h1>${esc(topic.h1)} <span>${esc(topic.h1span)}</span></h1>
      <p class="lede">${esc(topic.intro)}</p>
      <a class="hero-cta" href="/shoein/">Meet Shoein' — the farrier's app &nbsp;→</a>
    </section>

${sections}

    <section class="block">
      <h2>Frequently asked</h2>
${faqHtml}
    </section>

    <div class="cta">
      <h2>Keep your whole book in your pocket</h2>
      <p>Shoein' keeps every client and horse in one place — addresses on a map, one-tap call and directions, and a due badge so you never miss a cycle.</p>
      <a class="cta-btn" href="/shoein/">See Shoein' &nbsp;→</a>
      <p class="cta-note">Built for farriers &nbsp;·&nbsp; Coming soon to iOS &amp; Android</p>
    </div>

    <section class="block">
      <h2>More farrier guides</h2>
      <div class="related">
        ${related(topic)}
      </div>
    </section>

    <p class="disclaimer">
      This page is general information for farriers and horse owners, not veterinary advice. Every horse is
      different — for a specific animal, rely on your own farrier and veterinarian.
    </p>
  </main>

  <footer>
    <p>
      &copy; 2026 Auaha App Development LLC &nbsp;·&nbsp;
      <a href="/">Auaha.app</a> &nbsp;·&nbsp;
      <a href="/shoein/">Shoein'</a> &nbsp;·&nbsp;
      <a href="/shoein/support">Support</a> &nbsp;·&nbsp;
      <a href="/shoein/privacy">Privacy Policy</a> &nbsp;·&nbsp;
      <a href="/shoein/terms">Terms of Service</a> &nbsp;·&nbsp;
      <a href="mailto:hello@auaha.app">hello@auaha.app</a>
    </p>
  </footer>

</body>

</html>
`;
}

for (const topic of data.topics) {
  const dir = resolve(root, "shoein", topic.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "index.html"), page(topic));
  console.log(`✓ shoein/${topic.slug}/index.html`);
}
console.log(`\nDone — ${data.topics.length} Shoein' SEO pages generated.`);
