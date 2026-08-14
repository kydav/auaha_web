#!/usr/bin/env node
// Generates SEO landing pages for Auaha App Development (the studio), targeting
// "Utah app development", "cross-platform app development", etc. — plus a hub
// at /app-development/. Edit scripts/agency-topics.json, then run:
//   npm run gen:agency
//
// Static HTML on the Cloudflare edge, no build step. Sitemap entries are emitted
// by generate-state-pages.mjs (it imports this file), so `npm run gen` refreshes
// everything.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const data = JSON.parse(
  readFileSync(resolve(__dirname, "agency-topics.json"), "utf8")
);

const SITE = data.site.replace(/\/$/, "");
const BIZ = data.business;
const MAILTO = `mailto:${BIZ.email}?subject=App%20project%20inquiry`;

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const STYLE = `
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--bg:#0a0f1e;--surface:#111827;--card:#1a2235;--accent:#38bdf8;--accent2:#818cf8;--text:#f1f5f9;--muted:#94a3b8;--border:#1e2d45}
    html{scroll-behavior:smooth}
    body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);line-height:1.6}
    a{color:var(--accent)}
    nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;justify-content:space-between;align-items:center;padding:1rem 2rem;background:rgba(10,15,30,.85);backdrop-filter:blur(12px);border-bottom:1px solid var(--border)}
    .logo{font-size:1.4rem;font-weight:700;letter-spacing:-.5px;color:var(--text);text-decoration:none}
    .logo span{color:var(--accent)}
    .nav-links{display:flex;align-items:center;gap:1.5rem;list-style:none}
    .nav-links a{color:var(--muted);text-decoration:none;font-size:.9rem;transition:color .2s}
    .nav-links a:hover{color:var(--accent)}
    .nav-cta{background:var(--accent);color:#0a0f1e !important;padding:.45rem 1.1rem;border-radius:6px;font-weight:600}
    .container{max-width:820px;margin:0 auto;padding:0 1.5rem}
    .wide{max-width:1000px}
    .breadcrumb{font-size:.82rem;color:var(--muted);padding-top:6.5rem}
    .breadcrumb a{color:var(--muted);text-decoration:none}
    .breadcrumb a:hover{color:var(--accent)}
    .hero{padding:1.5rem 0 2.5rem}
    .badge{display:inline-block;background:rgba(56,189,248,.12);color:var(--accent);border:1px solid rgba(56,189,248,.25);border-radius:99px;padding:.3rem 1rem;font-size:.82rem;font-weight:600;letter-spacing:.5px;text-transform:uppercase;margin-bottom:1.25rem}
    h1{font-size:clamp(2rem,5vw,3rem);font-weight:800;line-height:1.12;letter-spacing:-1px;margin-bottom:1.1rem}
    h1 span{background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .lede{font-size:1.12rem;color:var(--muted);margin-bottom:1.75rem}
    .btn-group{display:flex;gap:1rem;flex-wrap:wrap}
    .btn{display:inline-flex;align-items:center;padding:.8rem 1.5rem;border-radius:8px;font-weight:600;text-decoration:none;transition:all .2s}
    .btn-primary{background:var(--accent);color:#0a0f1e}
    .btn-primary:hover{opacity:.88;transform:translateY(-1px)}
    .btn-outline{border:1px solid var(--border);color:var(--text)}
    .btn-outline:hover{border-color:var(--accent);color:var(--accent)}
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
    .portfolio{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1rem}
    .pcard{display:flex;gap:.9rem;align-items:center;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1rem;text-decoration:none;transition:all .2s}
    .pcard:hover{border-color:var(--accent);transform:translateY(-2px)}
    .pcard img{width:44px;height:44px;border-radius:10px}
    .pcard b{color:var(--text);font-size:.95rem;display:block}
    .pcard span{color:var(--muted);font-size:.82rem}
    .cta{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:2.5rem 2rem;text-align:center;margin:2.5rem 0}
    .cta h2{margin-bottom:.6rem}
    .cta p{max-width:440px;margin:0 auto 1.5rem}
    .related{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1rem}
    .related a{display:inline-block;padding:.55rem 1.1rem;border:1px solid var(--border);border-radius:10px;color:var(--text);text-decoration:none;font-size:.92rem;font-weight:600;transition:all .2s;background:rgba(255,255,255,.03)}
    .related a:hover{border-color:var(--accent);color:var(--accent)}
    .hub-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.25rem;margin-top:1.5rem}
    .hub-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:1.5rem;text-decoration:none;transition:all .2s}
    .hub-card:hover{border-color:var(--accent);transform:translateY(-3px)}
    .hub-card b{color:var(--text);font-size:1.05rem;display:block;margin-bottom:.4rem}
    .hub-card span{color:var(--muted);font-size:.9rem}
    footer{border-top:1px solid var(--border);padding:2rem 1.5rem;text-align:center;color:var(--muted);font-size:.875rem}
    footer a{color:var(--accent);text-decoration:none}
    footer a:hover{text-decoration:underline}
    @media(max-width:600px){.nav-links{display:none}}`;

const NAV = `
  <nav>
    <a href="/" class="logo">Auaha<span>.</span></a>
    <ul class="nav-links">
      <li><a href="/#services">Services</a></li>
      <li><a href="/#apps">Apps</a></li>
      <li><a href="/app-development/">App Development</a></li>
      <li><a href="${MAILTO}" class="nav-cta">Get in Touch</a></li>
    </ul>
  </nav>`;

const FOOTER = `
  <footer>
    <p>&copy; 2026 ${esc(BIZ.legalName)} &nbsp;·&nbsp; ${esc(BIZ.region)}, USA &nbsp;·&nbsp;
      <a href="/">Auaha.app</a> &nbsp;·&nbsp;
      <a href="/app-development/">App Development</a> &nbsp;·&nbsp;
      <a href="mailto:${BIZ.email}">${esc(BIZ.email)}</a> &nbsp;·&nbsp;
      <a href="/privacy/">Privacy</a> &nbsp;·&nbsp;
      <a href="/terms/">Terms</a>
    </p>
  </footer>`;

const PORTFOLIO = `
    <section class="block">
      <h2>Apps we've shipped</h2>
      <p>Real products, live on the App Store — proof we ship, not just pitch.</p>
      <div class="portfolio">
        <a class="pcard" href="/threshold/">
          <img src="/icons/threshold.png" alt="Threshold icon" />
          <span><b>Threshold</b>Buyer agreements for real estate agents</span>
        </a>
        <a class="pcard" href="/prior/">
          <img src="/icons/prior.png" alt="Prior icon" />
          <span><b>Prior</b>Water-rights lookup for Utah &amp; Colorado</span>
        </a>
        <a class="pcard" href="/proteingrid/">
          <img src="/icons/proteingrid.png" alt="ProteinGrid icon" />
          <span><b>ProteinGrid</b>Fast daily protein tracking</span>
        </a>
      </div>
    </section>`;

function head(title, desc, url, jsonld) {
  return `<head>
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
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:site_name" content="Auaha App Development" />
  <meta property="og:image" content="${SITE}/apple-touch-icon.png" />
  <meta name="twitter:card" content="summary" />
${jsonld}
  <style>${STYLE}
  </style>
</head>`;
}

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
  const paras = (sec.body || []).map((p) => `      <p>${esc(p)}</p>`).join("\n");
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
        `<a href="/app-development/${t.slug}/">${esc(t.metaTitle.replace(/[:—].*$/, "").trim())}</a>`
    )
    .join("\n        ");
}

function topicJsonLd(topic, url) {
  const service = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: BIZ.name,
    image: `${SITE}/apple-touch-icon.png`,
    "@id": url,
    url: BIZ.url,
    email: BIZ.email,
    areaServed: { "@type": "State", name: BIZ.region },
    address: { "@type": "PostalAddress", addressRegion: BIZ.region, addressCountry: "US" },
    description: topic.metaDescription,
    serviceType: topic.keyword,
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
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "App Development",
        item: `${SITE}/app-development/`,
      },
      { "@type": "ListItem", position: 3, name: topic.metaTitle, item: url },
    ],
  };
  return [service, faq, crumbs]
    .map(
      (o) =>
        `  <script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n  </script>`
    )
    .join("\n");
}

function topicPage(topic) {
  const url = `${SITE}/app-development/${topic.slug}/`;
  const title = `${topic.metaTitle} | Auaha App Development`;
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

${head(title, topic.metaDescription, url, topicJsonLd(topic, url))}

<body>
${NAV}

  <main class="container">
    <p class="breadcrumb">
      <a href="/">Home</a> &nbsp;›&nbsp; <a href="/app-development/">App Development</a> &nbsp;›&nbsp; ${esc(topic.metaTitle)}
    </p>

    <section class="hero">
      <div class="badge">${esc(topic.badge)}</div>
      <h1>${esc(topic.h1)} <span>${esc(topic.h1span)}</span></h1>
      <p class="lede">${esc(topic.intro)}</p>
      <div class="btn-group">
        <a class="btn btn-primary" href="${MAILTO}">Start a project</a>
        <a class="btn btn-outline" href="/#apps">See our work</a>
      </div>
    </section>

${sections}

${PORTFOLIO}

    <section class="block">
      <h2>Frequently asked</h2>
${faqHtml}
    </section>

    <div class="cta">
      <h2>Have a project in mind?</h2>
      <p>Tell us about it — we'll get back to you within one business day. Whether it's a full spec or a napkin idea, we'll help you build something people actually use.</p>
      <a class="btn btn-primary" href="${MAILTO}">Get in touch</a>
    </div>

    <section class="block">
      <h2>More on app development</h2>
      <div class="related">
        ${related(topic)}
      </div>
    </section>
  </main>
${FOOTER}

</body>

</html>
`;
}

function hubPage() {
  const h = data.hub;
  const url = `${SITE}/app-development/`;
  const title = `${h.metaTitle} | Auaha App Development`;
  const jsonld = [
    {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: BIZ.name,
      "@id": url,
      url: BIZ.url,
      email: BIZ.email,
      areaServed: { "@type": "State", name: BIZ.region },
      address: {
        "@type": "PostalAddress",
        addressRegion: BIZ.region,
        addressCountry: "US",
      },
      description: h.metaDescription,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        {
          "@type": "ListItem",
          position: 2,
          name: "App Development",
          item: url,
        },
      ],
    },
  ]
    .map(
      (o) =>
        `  <script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n  </script>`
    )
    .join("\n");

  const cards = data.topics
    .map(
      (t) =>
        `        <a class="hub-card" href="/app-development/${t.slug}/">
          <b>${esc(t.metaTitle)}</b>
          <span>${esc(t.metaDescription)}</span>
        </a>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">

${head(title, h.metaDescription, url, jsonld)}

<body>
${NAV}

  <main class="container wide">
    <p class="breadcrumb">
      <a href="/">Home</a> &nbsp;›&nbsp; App Development
    </p>

    <section class="hero">
      <div class="badge">${esc(h.badge)}</div>
      <h1>${esc(h.h1)} <span>${esc(h.h1span)}</span></h1>
      <p class="lede">${esc(h.intro)}</p>
      <div class="btn-group">
        <a class="btn btn-primary" href="${MAILTO}">Start a project</a>
        <a class="btn btn-outline" href="/#apps">See our work</a>
      </div>
    </section>

    <section class="block">
      <h2>How we can help</h2>
      <div class="hub-grid">
${cards}
      </div>
    </section>

${PORTFOLIO}
  </main>
${FOOTER}

</body>

</html>
`;
}

// ── Write hub + topic pages ─────────────────────────────────────────────────
mkdirSync(resolve(root, "app-development"), { recursive: true });
writeFileSync(resolve(root, "app-development", "index.html"), hubPage());
console.log("✓ app-development/index.html");

for (const topic of data.topics) {
  const dir = resolve(root, "app-development", topic.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "index.html"), topicPage(topic));
  console.log(`✓ app-development/${topic.slug}/index.html`);
}
console.log(`\nDone — hub + ${data.topics.length} agency SEO pages generated.`);
