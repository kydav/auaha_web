#!/usr/bin/env node
// Generates SEO landing pages for Threshold, one per state, plus sitemap.xml
// and robots.txt. Edit scripts/states.json, then run:  npm run gen:states
//
// Pages are plain static HTML served from the Cloudflare edge — fully
// crawlable, no build step, no client JS required.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const data = JSON.parse(readFileSync(resolve(__dirname, "states.json"), "utf8"));

const SITE = data.site.replace(/\/$/, "");
const TODAY = new Date().toISOString().slice(0, 10);

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const APPLE_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>`;
const PLAY_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#EA4335" d="M12.954 11.558 3.906.5H3.9c-.258.198-.4.499-.4.834v21.334c0 .335.142.636.4.834z"/><path fill="#FBBC04" d="m16.063 14.667-3.109-3.109-9.048 11.942c.25.208.565.333.885.333.277 0 .553-.08.793-.247z"/><path fill="#34A853" d="M16.063 9.333 5.584.414C5.344.247 5.068.167 4.791.167c-.32 0-.635.125-.885.333l9.048 11.942z"/><path fill="#4285F4" d="M20.55 10.714 16.063 8.167l-3.109 3.391 3.109 3.109 4.487-2.547c.716-.406.716-1.806 0-2.406z"/></svg>`;

const storeButtons = () => `
      <div class="store-buttons">
        <a href="${data.appStoreUrl}" class="store-btn" rel="nofollow">
          ${APPLE_SVG}
          <span class="store-btn-text">
            <span class="store-btn-sub">Download on the</span>
            <span class="store-btn-name">App Store</span>
          </span>
        </a>
        <a href="${data.playStoreUrl}" class="store-btn" rel="nofollow">
          ${PLAY_SVG}
          <span class="store-btn-text">
            <span class="store-btn-sub">Get it on</span>
            <span class="store-btn-name">Google Play</span>
          </span>
        </a>
      </div>`;

const STYLE = `
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--bg:#0a0f1e;--surface:#111827;--card:#1a2235;--accent:#6366f1;--accent2:#a78bfa;--text:#f1f5f9;--muted:#94a3b8;--border:#1e2d45}
    html{scroll-behavior:smooth}
    body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);line-height:1.6}
    a{color:var(--accent)}
    nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;justify-content:space-between;align-items:center;padding:1rem 2rem;background:rgba(10,15,30,.85);backdrop-filter:blur(12px);border-bottom:1px solid var(--border)}
    .logo{font-size:1.4rem;font-weight:700;letter-spacing:-.5px;color:var(--text);text-decoration:none}
    .logo span{color:var(--accent)}
    .nav-links{display:flex;align-items:center;gap:1.5rem;list-style:none}
    .nav-links a{color:var(--muted);text-decoration:none;font-size:.9rem;transition:color .2s}
    .nav-links a:hover{color:var(--accent)}
    .container{max-width:820px;margin:0 auto;padding:0 1.5rem}
    .breadcrumb{font-size:.82rem;color:var(--muted);padding-top:6.5rem}
    .breadcrumb a{color:var(--muted);text-decoration:none}
    .breadcrumb a:hover{color:var(--accent)}
    .hero{padding:1.5rem 0 3rem}
    .badge{display:inline-block;background:rgba(99,102,241,.12);color:var(--accent);border:1px solid rgba(99,102,241,.25);border-radius:99px;padding:.3rem 1rem;font-size:.82rem;font-weight:600;letter-spacing:.5px;text-transform:uppercase;margin-bottom:1.25rem}
    h1{font-size:clamp(2rem,5vw,3rem);font-weight:800;line-height:1.12;letter-spacing:-1px;margin-bottom:1.1rem}
    h1 span{background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .lede{font-size:1.12rem;color:var(--muted);margin-bottom:2rem}
    .store-buttons{display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1rem}
    .store-btn{display:inline-flex;align-items:center;gap:.7rem;padding:.75rem 1.4rem;border-radius:10px;text-decoration:none;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:var(--text);transition:all .2s;min-width:160px}
    .store-btn:hover{border-color:var(--accent);background:rgba(99,102,241,.08);transform:translateY(-2px)}
    .store-btn svg{flex-shrink:0}
    .store-btn-text{text-align:left;line-height:1.2}
    .store-btn-sub{font-size:.7rem;color:var(--muted);display:block}
    .store-btn-name{font-size:1rem;font-weight:700;display:block}
    section.block{padding:2.5rem 0;border-top:1px solid var(--border)}
    h2{font-size:clamp(1.5rem,3vw,2rem);font-weight:800;letter-spacing:-.5px;margin-bottom:1rem}
    h3{font-size:1.05rem;font-weight:700;margin-bottom:.4rem}
    p{color:var(--muted)}
    .block p+p{margin-top:1rem}
    ul.checks{list-style:none;margin-top:1rem}
    ul.checks li{position:relative;padding-left:1.9rem;margin-bottom:.85rem;color:var(--muted)}
    ul.checks li::before{content:'✓';position:absolute;left:0;top:0;color:var(--accent);font-weight:800}
    ul.checks li b{color:var(--text);font-weight:600}
    .faq-item{border:1px solid var(--border);border-radius:12px;padding:1.25rem 1.4rem;margin-bottom:1rem;background:var(--card)}
    .faq-item h3{margin-bottom:.5rem}
    .faq-item p{font-size:.97rem}
    .cta{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:2.5rem 2rem;text-align:center;margin:2.5rem 0}
    .cta h2{margin-bottom:.6rem}
    .cta p{max-width:420px;margin:0 auto 1.75rem}
    .cta .store-buttons{justify-content:center}
    .state-links{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1rem}
    .state-links a{display:inline-block;padding:.55rem 1.1rem;border:1px solid var(--border);border-radius:10px;color:var(--text);text-decoration:none;font-size:.92rem;font-weight:600;transition:all .2s;background:rgba(255,255,255,.03)}
    .state-links a:hover{border-color:var(--accent);color:var(--accent)}
    .guide{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem;text-decoration:none;background:linear-gradient(135deg,rgba(99,102,241,.14),rgba(167,139,250,.08));border:1px solid rgba(99,102,241,.32);border-radius:14px;padding:1.4rem 1.5rem;margin:.5rem 0 1rem}
    .guide-txt{max-width:60%}
    .guide-txt b{color:var(--text);font-size:1.02rem}
    .guide-txt span{display:block;color:var(--muted);font-size:.9rem;margin-top:.2rem}
    .guide-btn{display:inline-flex;align-items:center;background:var(--accent);color:#fff;padding:.7rem 1.3rem;border-radius:10px;font-weight:700;font-size:.95rem;white-space:nowrap;transition:all .2s}
    .guide:hover .guide-btn{background:#4f52e0;transform:translateY(-1px)}
    @media(max-width:600px){.guide-txt{max-width:100%}}
    .disclaimer{font-size:.8rem;color:var(--muted);border-top:1px solid var(--border);padding:1.75rem 0;line-height:1.5}
    footer{border-top:1px solid var(--border);padding:2rem 1.5rem;text-align:center;color:var(--muted);font-size:.875rem}
    footer a{color:var(--accent);text-decoration:none}
    footer a:hover{text-decoration:underline}
    @media(max-width:600px){.nav-links{display:none}}`;

function otherStates(current) {
  const others = data.states.filter((s) => s.slug !== current.slug);
  return others
    .map(
      (s) =>
        `<a href="/threshold/${s.slug}/">Buyer agreements in ${esc(s.name)}</a>`
    )
    .join("\n        ");
}

function jsonLd(state, url) {
  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Threshold",
    applicationCategory: "BusinessApplication",
    operatingSystem: "iOS, Android",
    description: `Threshold helps ${state.name} real estate agents complete, sign, and store buyer representation agreements on their phone.`,
    url,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    downloadUrl: [data.appStoreUrl, data.playStoreUrl],
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: state.faqs.map((f) => ({
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
        name: "Threshold",
        item: `${SITE}/threshold/`,
      },
      { "@type": "ListItem", position: 3, name: state.name, item: url },
    ],
  };
  return [software, faq, crumbs]
    .map(
      (o) =>
        `  <script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n  </script>`
    )
    .join("\n");
}

function page(state) {
  const url = `${SITE}/threshold/${state.slug}/`;
  const guide = `${state.name.toLowerCase()}-buyer-agreement-compliance-guide.pdf`;
  const title = `Buyer Broker Agreement App for ${state.name} Agents | Threshold`;
  const desc = `${state.name} real estate agents: complete, sign, and store buyer representation agreements on your phone with Threshold. ${state.name === "Wisconsin" ? "Built around the WB-36." : `Guided ${state.formShort}.`} Works offline.`;

  const faqHtml = state.faqs
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
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:site_name" content="Threshold" />
  <meta property="og:image" content="${SITE}/apple-touch-icon.png" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
${jsonLd(state, url)}
  <style>${STYLE}
  </style>
</head>

<body>

  <nav>
    <a href="/" class="logo">Auaha<span>.</span></a>
    <ul class="nav-links">
      <li><a href="/threshold/">Threshold</a></li>
      <li><a href="/threshold/support">Support</a></li>
      <li><a href="/threshold/privacy">Privacy</a></li>
    </ul>
  </nav>

  <main class="container">
    <p class="breadcrumb">
      <a href="/">Home</a> &nbsp;›&nbsp; <a href="/threshold/">Threshold</a> &nbsp;›&nbsp; ${esc(state.name)}
    </p>

    <section class="hero">
      <div class="badge">${esc(state.name)} Real Estate Agents</div>
      <h1>Buyer Broker Agreement App for <span>${esc(state.name)}</span></h1>
      <p class="lede">${esc(state.intro)}</p>
      ${storeButtons()}
    </section>

    <a class="guide" href="/threshold/${state.slug}/${guide}" download>
      <span class="guide-txt">
        <b>Free: ${esc(state.name)} Buyer Agreement Compliance Guide (PDF)</b>
        <span>The 2024 rules, the ${esc(state.formShort)}, a compliance checklist, and FAQ — one file to keep.</span>
      </span>
      <span class="guide-btn">↓ &nbsp;Download the guide</span>
    </a>

    <section class="block">
      <h2>What changed for ${esc(state.name)} agents</h2>
      <p>${esc(state.changed)}</p>
    </section>

    <section class="block">
      <h2>What your written buyer agreement needs</h2>
      <ul class="checks">
        <li><b>A signature before touring.</b> Agents working through an MLS need the agreement signed before showing a home, in person or virtually.</li>
        <li><b>A specific compensation amount.</b> The figure must be objective and agreed with your buyer — not open-ended, and not more than you and the buyer set.</li>
        <li><b>Clear terms and dates.</b> The scope of representation and the time period should be spelled out, using ${esc(state.formName)}.</li>
        <li><b>The buyer's signature on file.</b> Keep a signed copy you can produce for your brokerage or a compliance check.</li>
      </ul>
    </section>

    <section class="block">
      <h2>How Threshold helps</h2>
      <ul class="checks">
        <li><b>${esc(state.name)}'s form, guided.</b> Threshold walks you through ${esc(state.formName)} field by field so nothing required is missed.</li>
        <li><b>Sign anywhere.</b> Complete the agreement and capture buyer and agent signatures on-screen — at the property, in the car, or over coffee.</li>
        <li><b>Works offline.</b> Agreements live on your device, so a weak signal never stops you from getting one signed.</li>
        <li><b>Export and share.</b> Send a finished PDF to your buyer or brokerage in seconds.</li>
      </ul>
    </section>

    <section class="block">
      <h2>${esc(state.name)} buyer agreement FAQ</h2>
${faqHtml}
    </section>

    <div class="cta">
      <h2>Get ${esc(state.name)} buyers under agreement — anywhere</h2>
      <p>Download Threshold and complete your next ${esc(state.formShort)} from your phone.</p>
      ${storeButtons()}
    </div>

    <section class="block">
      <h2>Also available in</h2>
      <div class="state-links">
        ${otherStates(state)}
      </div>
      <p style="margin-top:1rem">
        In a different state? See the
        <a href="/threshold/buyer-broker-agreement-by-state/">buyer broker agreement requirements by state&nbsp;→</a>
      </p>
    </section>

    <p class="disclaimer">
      This page is general information for real estate professionals, not legal advice. Requirements and approved
      form versions change — always confirm the current ${esc(state.formName)} and your obligations with your broker
      and the ${esc(state.commission)}.
    </p>
  </main>

  <footer>
    <p>
      &copy; 2026 Auaha App Development LLC &nbsp;·&nbsp;
      <a href="/">Auaha.app</a> &nbsp;·&nbsp;
      <a href="/threshold/">Threshold</a> &nbsp;·&nbsp;
      <a href="/threshold/support">Support</a> &nbsp;·&nbsp;
      <a href="/threshold/privacy">Privacy Policy</a> &nbsp;·&nbsp;
      <a href="/threshold/terms">Terms of Service</a> &nbsp;·&nbsp;
      <a href="mailto:hello@auaha.app">hello@auaha.app</a>
    </p>
  </footer>

</body>

</html>
`;
}

// ── Write state pages ───────────────────────────────────────────────────────
for (const state of data.states) {
  const dir = resolve(root, "threshold", state.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "index.html"), page(state));
  console.log(`✓ threshold/${state.slug}/index.html`);
}

// ── sitemap.xml ─────────────────────────────────────────────────────────────
const urls = [
  { loc: `${SITE}/`, pri: "1.0" },
  { loc: `${SITE}/threshold/`, pri: "0.9" },
  { loc: `${SITE}/threshold/can-i-show-this-house/`, pri: "0.8" },
  { loc: `${SITE}/threshold/buyer-transaction-compliance-checklist/`, pri: "0.8" },
  { loc: `${SITE}/threshold/buyer-compensation-explainer/`, pri: "0.8" },
  { loc: `${SITE}/threshold/buyer-broker-agreement-by-state/`, pri: "0.8" },
  ...data.states.map((s) => ({
    loc: `${SITE}/threshold/${s.slug}/`,
    pri: "0.8",
  })),
  { loc: `${SITE}/threshold/support`, pri: "0.4" },
  { loc: `${SITE}/threshold/privacy`, pri: "0.3" },
  { loc: `${SITE}/threshold/terms`, pri: "0.3" },
  { loc: `${SITE}/functionalparenting/`, pri: "0.6" },
  { loc: `${SITE}/prior/`, pri: "0.6" },
  { loc: `${SITE}/proteingrid/`, pri: "0.6" },
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <priority>${u.pri}</priority>\n  </url>`
  )
  .join("\n")}
</urlset>
`;
writeFileSync(resolve(root, "sitemap.xml"), sitemap);
console.log("✓ sitemap.xml");

// ── robots.txt ──────────────────────────────────────────────────────────────
const robots = `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`;
writeFileSync(resolve(root, "robots.txt"), robots);
console.log("✓ robots.txt");

console.log(`\nDone — ${data.states.length} state pages generated.`);
