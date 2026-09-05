#!/usr/bin/env node
// Generates the layoff/career-transition cluster:
//   /layoff/          — the hub, which IS the 15-minute values exercise
//   /layoff/<slug>/   — SEO articles, each feeding the exercise
//
// Edit scripts/layoff-topics.json, then run:  npm run gen:layoff
//
// The articles are plain static HTML with no client JS beyond a ~20-line
// analytics beacon. The hub carries the exercise, which is vanilla JS and keeps
// everything the visitor writes in localStorage — the text never leaves the
// device. Only anonymous counters go to /api/e.
//
// Sitemap entries are emitted by generate-state-pages.mjs (it imports this
// topics file), so run `npm run gen` to refresh everything.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const data = JSON.parse(
  readFileSync(resolve(__dirname, "layoff-topics.json"), "utf8")
);

const SITE = data.site.replace(/\/$/, "");
const BASE = data.base.replace(/\/$/, "");
const BRAND = data.brand;

// Article dates for rich results. Bump MODIFIED when content actually changes,
// not on every regeneration.
const DEFAULT_PUBLISHED = "2026-09-04";
const DEFAULT_MODIFIED = "2026-09-04";

const PAPER_URL = "https://www.pnas.org/doi/10.1073/pnas.2301532120";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ── Shared styles ───────────────────────────────────────────────────────────
// Calm, adult, deliberately not a wellness palette: deep ink ground with a
// single muted teal. The audience is someone who was walked out of a building
// this week; anything bright reads as insulting.
const STYLE = `
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--bg:#14181a;--surface:#1b2123;--card:#212a2c;--accent:#5aa89b;--accent2:#8fcfc3;--text:#f2f4f3;--muted:#a8b3b1;--border:#2e3839}
    html{scroll-behavior:smooth}
    body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);line-height:1.65}
    a{color:var(--accent)}
    nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;justify-content:space-between;align-items:center;padding:1rem 2rem;background:rgba(20,24,26,.85);backdrop-filter:blur(12px);border-bottom:1px solid var(--border)}
    .logo{font-size:1.3rem;font-weight:700;letter-spacing:-.4px;color:var(--text);text-decoration:none}
    .logo span{color:var(--accent)}
    .nav-links{display:flex;align-items:center;gap:1.5rem;list-style:none}
    .nav-links a{color:var(--muted);text-decoration:none;font-size:.9rem;transition:color .2s}
    .nav-links a:hover{color:var(--accent)}
    .container{max-width:760px;margin:0 auto;padding:0 1.5rem}
    .breadcrumb{font-size:.82rem;color:var(--muted);padding-top:6.5rem}
    .breadcrumb a{color:var(--muted);text-decoration:none}
    .breadcrumb a:hover{color:var(--accent)}
    .hero{padding:1.5rem 0 2.5rem}
    .badge{display:inline-block;background:rgba(90,168,155,.12);color:var(--accent2);border:1px solid rgba(90,168,155,.30);border-radius:99px;padding:.3rem 1rem;font-size:.8rem;font-weight:600;letter-spacing:.5px;text-transform:uppercase;margin-bottom:1.25rem}
    h1{font-size:clamp(1.9rem,4.6vw,2.8rem);font-weight:800;line-height:1.14;letter-spacing:-.8px;margin-bottom:1.1rem}
    h1 span{color:var(--accent2)}
    .lede{font-size:1.1rem;color:var(--muted);margin-bottom:1.75rem}
    .hero-cta{display:inline-flex;align-items:center;gap:.6rem;background:var(--accent);color:#0f1416;padding:.75rem 1.4rem;border-radius:10px;font-weight:700;font-size:.95rem;text-decoration:none;transition:all .2s}
    .hero-cta:hover{background:var(--accent2);transform:translateY(-1px)}
    section.block{padding:2.5rem 0;border-top:1px solid var(--border)}
    h2{font-size:clamp(1.4rem,3vw,1.85rem);font-weight:800;letter-spacing:-.4px;margin-bottom:1rem}
    p{color:var(--muted)}
    .block p+p{margin-top:1rem}
    ul.checks{list-style:none;margin-top:1rem}
    ul.checks li{position:relative;padding-left:1.9rem;margin-bottom:.85rem;color:var(--muted)}
    ul.checks li::before{content:'—';position:absolute;left:0;top:0;color:var(--accent);font-weight:800}
    ul.checks li b{color:var(--text);font-weight:600}
    .faq-item{border:1px solid var(--border);border-radius:12px;padding:1.25rem 1.4rem;margin-bottom:1rem;background:var(--card)}
    .faq-item h3{margin-bottom:.5rem;font-size:1.03rem;font-weight:700}
    .faq-item p{font-size:.97rem}
    .cta{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:2.4rem 2rem;text-align:center;margin:2.5rem 0}
    .cta h2{margin-bottom:.6rem}
    .cta p{max-width:460px;margin:0 auto 1.5rem}
    .cta-btn{display:inline-flex;align-items:center;gap:.5rem;background:var(--accent);color:#0f1416;padding:.85rem 1.6rem;border-radius:10px;font-weight:700;text-decoration:none;transition:all .2s;border:none;cursor:pointer;font-size:1rem}
    .cta-btn:hover{background:var(--accent2);transform:translateY(-2px)}
    .cta-note{font-size:.8rem;color:var(--muted);margin-top:1rem}
    .related{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1rem}
    .related a{display:inline-block;padding:.55rem 1.1rem;border:1px solid var(--border);border-radius:10px;color:var(--text);text-decoration:none;font-size:.92rem;font-weight:600;transition:all .2s;background:rgba(255,255,255,.03)}
    .related a:hover{border-color:var(--accent);color:var(--accent2)}
    .disclaimer{font-size:.8rem;color:var(--muted);border-top:1px solid var(--border);padding:1.75rem 0;line-height:1.55}
    .crisis{background:rgba(90,168,155,.07);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:10px;padding:1rem 1.2rem;margin:1.5rem 0;font-size:.9rem;color:var(--muted)}
    footer{border-top:1px solid var(--border);padding:2rem 1.5rem;text-align:center;color:var(--muted);font-size:.875rem}
    footer a{color:var(--accent);text-decoration:none}
    footer a:hover{text-decoration:underline}
    @media(max-width:600px){.nav-links{display:none}}`;

// Exercise-only styles, appended on the hub.
const EX_STYLE = `
    .ex{border:1px solid var(--border);background:var(--surface);border-radius:20px;padding:2rem 1.8rem;margin:2rem 0}
    .ex-step{display:none}
    .ex-step.on{display:block}
    .ex-kicker{font-size:.78rem;letter-spacing:1.2px;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:.7rem}
    .ex h3{font-size:1.35rem;font-weight:800;letter-spacing:-.3px;margin-bottom:.6rem}
    .ex p{margin-bottom:1.2rem}
    .vals{display:flex;flex-wrap:wrap;gap:.55rem;margin-bottom:1.3rem}
    .val{border:1px solid var(--border);background:rgba(255,255,255,.03);color:var(--text);border-radius:99px;padding:.5rem 1rem;font-size:.9rem;cursor:pointer;transition:all .15s;font-family:inherit}
    .val:hover{border-color:var(--accent)}
    .val[aria-pressed="true"]{background:rgba(90,168,155,.18);border-color:var(--accent);color:var(--accent2);font-weight:600}
    .val:focus-visible{outline:2px solid var(--accent2);outline-offset:2px}
    .ex-count{font-size:.85rem;color:var(--muted);margin-bottom:1.2rem}
    .ex textarea{width:100%;min-height:190px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:12px;padding:1rem;font-family:inherit;font-size:1rem;line-height:1.6;resize:vertical}
    .ex textarea:focus{outline:none;border-color:var(--accent)}
    .ex-prompt{background:rgba(90,168,155,.07);border-left:3px solid var(--accent);border-radius:8px;padding:.9rem 1.1rem;margin-bottom:1.1rem;font-size:.95rem;color:var(--text)}
    .ex-meta{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-top:.7rem;font-size:.82rem;color:var(--muted)}
    .ex-actions{display:flex;gap:.7rem;flex-wrap:wrap;margin-top:1.4rem;align-items:center}
    .btn{background:var(--accent);color:#0f1416;border:none;border-radius:10px;padding:.8rem 1.5rem;font-weight:700;font-size:.98rem;cursor:pointer;font-family:inherit;transition:all .2s}
    .btn:hover:not(:disabled){background:var(--accent2)}
    .btn:disabled{opacity:.4;cursor:not-allowed}
    .btn.ghost{background:transparent;border:1px solid var(--border);color:var(--muted)}
    .btn.ghost:hover{border-color:var(--accent);color:var(--accent2);background:transparent}
    .scale{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1.3rem}
    .scale button{flex:1;min-width:46px;background:rgba(255,255,255,.03);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:.75rem .4rem;cursor:pointer;font-family:inherit;font-size:.95rem;transition:all .15s}
    .scale button[aria-pressed="true"]{background:rgba(90,168,155,.18);border-color:var(--accent);color:var(--accent2);font-weight:700}
    .scale button:focus-visible{outline:2px solid var(--accent2);outline-offset:2px}
    .scale-ends{display:flex;justify-content:space-between;font-size:.78rem;color:var(--muted);margin:-.9rem 0 1.3rem}
    .done-vals{list-style:none;margin:1.2rem 0}
    .done-vals li{padding:.7rem 1rem;background:rgba(90,168,155,.08);border-radius:10px;margin-bottom:.5rem;color:var(--text);font-weight:600}
    .privacy-note{font-size:.83rem;color:var(--muted);border-top:1px solid var(--border);margin-top:1.6rem;padding-top:1rem}
    .keep{display:flex;gap:.6rem;flex-wrap:wrap;margin-top:1rem}
    .keep input{flex:1;min-width:210px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:10px;padding:.75rem 1rem;font-family:inherit;font-size:.95rem}
    .keep input:focus{outline:none;border-color:var(--accent)}`;

// ── Analytics beacon ────────────────────────────────────────────────────────
// Anonymous counters only. No cookies, no identifiers that survive the tab, and
// never any of what the visitor wrote — so there is nothing to consent to.
const BEACON = `
  <script>
  (function(){
    var sid;
    try{
      sid=sessionStorage.getItem('_s');
      if(!sid){sid=Math.random().toString(36).slice(2)+Date.now().toString(36);sessionStorage.setItem('_s',sid);}
    }catch(e){sid='nostore';}
    window.track=function(name,props){
      try{
        var body=JSON.stringify({e:name,s:sid,p:props||{},path:location.pathname,ref:document.referrer||''});
        if(navigator.sendBeacon){navigator.sendBeacon('/api/e',new Blob([body],{type:'application/json'}));}
        else{fetch('/api/e',{method:'POST',body:body,headers:{'Content-Type':'application/json'},keepalive:true});}
      }catch(e){}
    };
    window.track('page_view');
  })();
  </script>`;

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

function related(currentSlug) {
  return data.topics
    .filter((t) => t.slug !== currentSlug)
    .slice(0, 5)
    .map(
      (t) =>
        `<a href="${BASE}/${t.slug}/">${esc(
          t.metaTitle.replace(/[:—?].*$/, "").trim()
        )}</a>`
    )
    .join("\n        ");
}

function head({ title, desc, url, jsonLd, extraStyle = "" }) {
  return `<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/x-icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${url}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:site_name" content="${esc(BRAND)}" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
${jsonLd}
  <style>${STYLE}${extraStyle}
  </style>
</head>`;
}

function chrome() {
  return `  <nav>
    <a href="${BASE}/" class="logo">${esc(BRAND)}<span>.</span></a>
    <ul class="nav-links">
      <li><a href="${BASE}/">The exercise</a></li>
      <li><a href="${BASE}/just-got-laid-off-what-to-do/">First week</a></li>
      <li><a href="https://auaha.app/">Auaha</a></li>
    </ul>
  </nav>`;
}

function footer() {
  return `  <footer>
    <p>
      &copy; 2026 Auaha App Development LLC &nbsp;·&nbsp;
      <a href="https://auaha.app/">Auaha.app</a> &nbsp;·&nbsp;
      <a href="${BASE}/">The exercise</a> &nbsp;·&nbsp;
      <a href="mailto:hello@auaha.app">hello@auaha.app</a>
    </p>
  </footer>`;
}

const CRISIS = `    <div class="crisis">
      This page isn't therapy, medical care, legal advice or career advice, and
      it doesn't promise any particular outcome. Losing a job carries a real risk
      of depression — if you're struggling badly, please talk to a doctor or a
      therapist. In the US you can call or text <b>988</b> at any time.
    </div>`;

// ── Article pages ───────────────────────────────────────────────────────────

function articleJsonLd(topic, url) {
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: topic.metaTitle,
    description: topic.metaDescription,
    about: topic.keyword,
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: "Auaha App Development LLC" },
    publisher: {
      "@type": "Organization",
      name: "Auaha App Development LLC",
      url: `${SITE}/`,
    },
    datePublished: topic.published || DEFAULT_PUBLISHED,
    dateModified: topic.modified || DEFAULT_MODIFIED,
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
      { "@type": "ListItem", position: 1, name: "After a layoff", item: `${SITE}${BASE}/` },
      { "@type": "ListItem", position: 2, name: topic.metaTitle, item: url },
    ],
  };
  return [article, faq, crumbs]
    .map(
      (o) =>
        `  <script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n  </script>`
    )
    .join("\n");
}

function articlePage(topic) {
  const url = `${SITE}${BASE}/${topic.slug}/`;
  const title = `${topic.metaTitle} | ${BRAND}`;
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

${head({ title, desc: topic.metaDescription, url, jsonLd: articleJsonLd(topic, url) })}

<body>

${chrome()}

  <main class="container">
    <p class="breadcrumb">
      <a href="${BASE}/">After a layoff</a> &nbsp;›&nbsp; ${esc(topic.metaTitle)}
    </p>

    <section class="hero">
      <div class="badge">${esc(topic.badge)}</div>
      <h1>${esc(topic.h1)} <span>${esc(topic.h1span)}</span></h1>
      <p class="lede">${esc(topic.intro)}</p>
      <a class="hero-cta" href="${BASE}/">Try the 15-minute exercise &nbsp;→</a>
    </section>

${sections}

    <section class="block">
      <h2>Frequently asked</h2>
${faqHtml}
    </section>

    <div class="cta">
      <h2>Fifteen minutes, and it's been tested</h2>
      <p>In a field study run with a government employment agency, people who wrote about their most important values received 49% more job offers over the next four weeks. Free, no account, and your writing never leaves your device.</p>
      <a class="cta-btn" href="${BASE}/">Start the exercise &nbsp;→</a>
      <p class="cta-note">Based on research published in PNAS &nbsp;·&nbsp; Nothing to install</p>
    </div>

    <section class="block">
      <h2>More on this</h2>
      <div class="related">
        ${related(topic.slug)}
      </div>
    </section>

${CRISIS}

    <p class="disclaimer">
      Written by Auaha App Development LLC. General information only — employment
      law, benefits and severance rules vary by country and by state, so confirm
      anything specific to your situation with someone qualified where you live.
    </p>
  </main>

${footer()}
${BEACON}

</body>

</html>
`;
}

// ── The hub / exercise page ─────────────────────────────────────────────────

function hubJsonLd(url) {
  const howto = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "A 15-minute values exercise for after a layoff",
    description: data.hub.metaDescription,
    totalTime: "PT15M",
    step: [
      { "@type": "HowToStep", name: "Choose your values", text: "Pick the two or three things that matter most to you outside of work." },
      { "@type": "HowToStep", name: "Write about the first one", text: "Write about why that value matters to you and a time it showed up in your life." },
      { "@type": "HowToStep", name: "Reflect", text: "Rate how much these values have shaped the life you've lived." },
    ],
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is this the same as positive affirmations?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Affirmations are statements about yourself that you repeat. This is a writing exercise about what you value and why — the version that has been tested in field experiments with unemployed people.",
        },
      },
      {
        "@type": "Question",
        name: "Does what I write get sent anywhere?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Your writing stays in your browser on your own device. Only anonymous counts are recorded — that an exercise was started or finished — so we know whether the page helps people.",
        },
      },
      {
        "@type": "Question",
        name: "How long does it take?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "About ten to fifteen minutes, which is the length used in the published study. It is done once rather than daily.",
        },
      },
    ],
  };
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Auaha", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "After a layoff", item: url },
    ],
  };
  return [howto, faq, crumbs]
    .map(
      (o) =>
        `  <script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n  </script>`
    )
    .join("\n");
}

function hubPage() {
  const url = `${SITE}${BASE}/`;
  const h = data.hub;
  const title = `${h.metaTitle} | ${BRAND}`;
  const valueButtons = data.values
    .map(
      (v, i) =>
        `        <button type="button" class="val" data-v="${i}" aria-pressed="false">${esc(v)}</button>`
    )
    .join("\n");
  const articleLinks = data.topics
    .map(
      (t) =>
        `<a href="${BASE}/${t.slug}/">${esc(t.metaTitle.replace(/[:—?].*$/, "").trim())}</a>`
    )
    .join("\n        ");

  return `<!DOCTYPE html>
<html lang="en">

${head({ title, desc: h.metaDescription, url, jsonLd: hubJsonLd(url), extraStyle: EX_STYLE })}

<body>

${chrome()}

  <main class="container">
    <section class="hero" style="padding-top:7rem">
      <div class="badge">${esc(h.badge)}</div>
      <h1>${esc(h.h1)} <span>${esc(h.h1span)}</span></h1>
      <p class="lede">${esc(h.intro)}</p>
    </section>

    <!-- ── The exercise ─────────────────────────────────────────────────── -->
    <div class="ex" id="ex">

      <div class="ex-step on" id="s0">
        <div class="ex-kicker">Before you start</div>
        <h3>Fifteen minutes, once.</h3>
        <p>
          This isn't a course and there's nothing to sign up for. You'll pick the
          things that matter most to you, write about one of them, and stop.
          That's the whole exercise — the same one used in the study.
        </p>
        <p>
          Do it somewhere you won't be interrupted. Writing badly is fine; nobody
          reads it, including us.
        </p>
        <div class="ex-actions">
          <button class="btn" id="begin">Begin</button>
        </div>
      </div>

      <div class="ex-step" id="s1">
        <div class="ex-kicker">Step 1 of 3</div>
        <h3>What matters most to you?</h3>
        <p>Pick two or three. Not what should matter — what actually does, outside of work.</p>
        <div class="vals" id="vals">
${valueButtons}
        </div>
        <div class="ex-count" id="valcount">None selected yet</div>
        <div class="ex-actions">
          <button class="btn" id="toWrite" disabled>Continue</button>
        </div>
      </div>

      <div class="ex-step" id="s2">
        <div class="ex-kicker">Step 2 of 3</div>
        <h3>Now write about the first one.</h3>
        <div class="ex-prompt" id="prompt"></div>
        <p>
          Aim for ten minutes or so. Don't worry about how it reads — this is for
          you, and it stays on your device.
        </p>
        <textarea id="writing" placeholder="Start anywhere…" aria-label="Your writing"></textarea>
        <div class="ex-meta">
          <span id="words">0 words</span>
          <span id="timer">0:00</span>
        </div>
        <div class="ex-actions">
          <button class="btn" id="toRate" disabled>I'm done writing</button>
          <button class="btn ghost" id="backVals">Back</button>
        </div>
      </div>

      <div class="ex-step" id="s3">
        <div class="ex-kicker">Step 3 of 3</div>
        <h3>How much have these shaped the life you've lived?</h3>
        <div class="scale" id="scale">
          <button type="button" data-n="1" aria-pressed="false">1</button>
          <button type="button" data-n="2" aria-pressed="false">2</button>
          <button type="button" data-n="3" aria-pressed="false">3</button>
          <button type="button" data-n="4" aria-pressed="false">4</button>
          <button type="button" data-n="5" aria-pressed="false">5</button>
          <button type="button" data-n="6" aria-pressed="false">6</button>
          <button type="button" data-n="7" aria-pressed="false">7</button>
        </div>
        <div class="scale-ends"><span>Hardly at all</span><span>Enormously</span></div>
        <div class="ex-actions">
          <button class="btn" id="finish" disabled>Finish</button>
        </div>
      </div>

      <div class="ex-step" id="s4">
        <div class="ex-kicker">Done</div>
        <h3>That's it. You're finished.</h3>
        <p>None of this was taken from you last week:</p>
        <ul class="done-vals" id="doneVals"></ul>
        <p>
          The job market will do what it does. What you just wrote about is the
          part that wasn't in the redundancy pool — and the reason this exercise
          is worth fifteen minutes is that people who are clear about that tend to
          apply, ask and interview differently.
        </p>
        <p>
          Come back to it whenever the search gets heavy. Your writing is saved on
          this device only, so it'll be here.
        </p>
        <div class="ex-actions">
          <button class="btn ghost" id="reread">Read what I wrote</button>
        </div>
        <div class="privacy-note">
          <b>Want a nudge in two weeks?</b> Optional, and the only thing we'd ever
          store about you.
          <div class="keep">
            <input type="email" id="email" placeholder="you@example.com" aria-label="Email address" />
            <button class="btn" id="saveEmail">Send me a check-in</button>
          </div>
          <p style="margin-top:.7rem;font-size:.83rem" id="emailMsg"></p>
        </div>
      </div>

    </div>

    <section class="block">
      <h2>Why this one and not the hundred others</h2>
      <p>
        Almost everything in this category is someone's opinion about how you
        should feel. This is a specific fifteen-minute task from two field
        experiments published in <em>PNAS</em> in 2023 — one of them run with a
        government employment agency, with 532 people who had just registered as
        unemployed.
      </p>
      <p>
        In that study, 10.9% of people who did the exercise were back in work
        within four weeks, against 3.4% of those who didn't, and they received
        about 49% more job offers. Two caveats worth stating plainly: the
        difference in how <em>quickly</em> people found work was around a day, and
        the effects were no longer statistically significant by eight weeks. The
        meaningful finding is offers, not speed.
      </p>
      <p>
        <a href="${PAPER_URL}" rel="noopener">Read the paper</a> if you'd like to
        check any of that. We'd rather you did.
      </p>
    </section>

    <section class="block">
      <h2>The practical stuff</h2>
      <div class="related">
        ${articleLinks}
      </div>
    </section>

${CRISIS}

    <p class="disclaimer">
      Built by <a href="https://auaha.app/">Auaha App Development LLC</a>. Free,
      with nothing to buy. Your writing is stored only in this browser — we never
      receive it, and we record only anonymous counts of whether the exercise was
      started and finished.
    </p>
  </main>

${footer()}
${BEACON}

  <script>
  (function(){
    var VALUES = ${JSON.stringify(data.values)};
    var KEY = 'tl_v1';
    var state = { vals: [], text: '', rating: 0, done: false };
    try { state = Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch(e) {}

    function save(){ try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e) {} }
    function $(id){ return document.getElementById(id); }
    function show(n){
      ['s0','s1','s2','s3','s4'].forEach(function(id, i){
        $(id).classList.toggle('on', i === n);
      });
      window.scrollTo({ top: $('ex').offsetTop - 80, behavior: 'smooth' });
    }

    // ── Step 1: values ────────────────────────────────────────────────────
    var valEls = Array.prototype.slice.call(document.querySelectorAll('.val'));
    function paintVals(){
      valEls.forEach(function(el){
        var i = parseInt(el.dataset.v, 10);
        el.setAttribute('aria-pressed', state.vals.indexOf(i) > -1 ? 'true' : 'false');
      });
      var n = state.vals.length;
      $('valcount').textContent = n === 0
        ? 'None selected yet'
        : n + ' selected' + (n < 2 ? ' — pick at least two' : '');
      $('toWrite').disabled = n < 2;
    }
    valEls.forEach(function(el){
      el.addEventListener('click', function(){
        var i = parseInt(el.dataset.v, 10);
        var at = state.vals.indexOf(i);
        if (at > -1) state.vals.splice(at, 1);
        else if (state.vals.length < 3) state.vals.push(i);
        save(); paintVals();
      });
    });

    // ── Step 2: writing ───────────────────────────────────────────────────
    var started = 0, tick = null;
    function words(){
      var t = $('writing').value.trim();
      return t ? t.split(/\\s+/).length : 0;
    }
    function paintWriting(){
      var w = words();
      $('words').textContent = w + (w === 1 ? ' word' : ' words');
      $('toRate').disabled = w < 20;
    }
    function startTimer(){
      if (tick) return;
      started = Date.now();
      tick = setInterval(function(){
        var s = Math.floor((Date.now() - started) / 1000);
        $('timer').textContent = Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
      }, 1000);
    }
    $('writing').addEventListener('input', function(){
      state.text = $('writing').value; save(); paintWriting();
    });

    // ── Step 3: rating ────────────────────────────────────────────────────
    Array.prototype.forEach.call(document.querySelectorAll('#scale button'), function(b){
      b.addEventListener('click', function(){
        state.rating = parseInt(b.dataset.n, 10); save();
        Array.prototype.forEach.call(document.querySelectorAll('#scale button'), function(x){
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        $('finish').disabled = false;
      });
    });

    // ── Navigation ────────────────────────────────────────────────────────
    $('begin').addEventListener('click', function(){
      window.track('exercise_started');
      show(1); paintVals();
    });
    $('toWrite').addEventListener('click', function(){
      $('prompt').textContent = 'Why does "' + VALUES[state.vals[0]] +
        '" matter to you? Write about a time it showed up in your life — a moment, a decision, a person.';
      $('writing').value = state.text || '';
      show(2); paintWriting(); startTimer();
      window.track('writing_started', { values: state.vals.length });
    });
    $('backVals').addEventListener('click', function(){ show(1); paintVals(); });
    $('toRate').addEventListener('click', function(){
      show(3);
      window.track('writing_finished', { words: words(), seconds: Math.floor((Date.now() - started) / 1000) });
    });
    $('finish').addEventListener('click', function(){
      state.done = true; save();
      $('doneVals').innerHTML = state.vals.map(function(i){
        return '<li>' + VALUES[i] + '</li>';
      }).join('');
      show(4);
      window.track('exercise_completed', {
        words: words(),
        seconds: started ? Math.floor((Date.now() - started) / 1000) : 0,
        rating: state.rating,
        values: state.vals.length
      });
    });
    $('reread').addEventListener('click', function(){
      $('writing').value = state.text || ''; show(2); paintWriting();
    });

    // ── Optional check-in email ───────────────────────────────────────────
    $('saveEmail').addEventListener('click', function(){
      var v = ($('email').value || '').trim();
      if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(v)) {
        $('emailMsg').textContent = "That doesn't look like an email address — mind checking it?";
        return;
      }
      fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: v })
      }).then(function(){
        $('emailMsg').textContent = "Done — we'll check in in two weeks. Nothing else, ever.";
        $('saveEmail').disabled = true;
        window.track('checkin_saved');
      }).catch(function(){
        $('emailMsg').textContent = "That didn't send. Try again in a moment?";
      });
    });

    // Someone who already finished comes straight back to the end.
    if (state.done) {
      $('doneVals').innerHTML = state.vals.map(function(i){
        return '<li>' + VALUES[i] + '</li>';
      }).join('');
      show(4);
    }
  })();
  </script>

</body>

</html>
`;
}

// ── Write everything ────────────────────────────────────────────────────────

const hubDir = resolve(root, BASE.replace(/^\//, ""));
mkdirSync(hubDir, { recursive: true });
writeFileSync(resolve(hubDir, "index.html"), hubPage());
console.log(`✓ ${BASE.replace(/^\//, "")}/index.html  (hub + exercise)`);

for (const topic of data.topics) {
  const dir = resolve(hubDir, topic.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "index.html"), articlePage(topic));
  console.log(`✓ ${BASE.replace(/^\//, "")}/${topic.slug}/index.html`);
}

console.log(`\nDone — hub + ${data.topics.length} layoff SEO pages generated.`);
