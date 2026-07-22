#!/usr/bin/env node
// Generates a branded "Buyer Agreement Compliance Guide" PDF per state from
// scripts/states.json, written next to each state landing page. Run:
//   npm run gen:guides   (or npm run gen for pages + guides together)

import PDFDocument from "pdfkit";
import { createWriteStream, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const data = JSON.parse(readFileSync(resolve(__dirname, "states.json"), "utf8"));

const INK = "#111827";
const MUTED = "#4b5563";
const ACCENT = "#6366f1";
const LINE = "#d7dbe6";

export function guideFileName(state) {
  return `${state.name.toLowerCase()}-buyer-agreement-compliance-guide.pdf`;
}

function build(state) {
  return new Promise((res, rej) => {
    const doc = new PDFDocument({
      size: "LETTER",
      bufferPages: true,
      margins: { top: 60, bottom: 64, left: 60, right: 60 },
      info: {
        Title: `${state.name} Buyer Agreement Compliance Guide`,
        Author: "Threshold — Auaha App Development LLC",
        Subject: `Written buyer representation agreement requirements for ${state.name} real estate agents`,
      },
    });
    const dir = resolve(root, "threshold", state.slug);
    const out = createWriteStream(resolve(dir, guideFileName(state)));
    doc.pipe(out);
    out.on("finish", res);
    out.on("error", rej);

    const L = doc.page.margins.left;
    const R = doc.page.width - doc.page.margins.right;
    const W = R - L;

    // ── Masthead ────────────────────────────────────────────────────────────
    doc
      .fillColor(ACCENT)
      .font("Helvetica-Bold")
      .fontSize(13)
      .text("THRESHOLD", L, 54, { characterSpacing: 2 });
    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(9)
      .text("Buyer Agreements for Real Estate Agents", { characterSpacing: 0.5 });
    doc.moveDown(1.4);

    doc
      .fillColor(INK)
      .font("Helvetica-Bold")
      .fontSize(23)
      .text(`${state.name} Buyer Agreement`, { lineGap: 2 });
    doc.fillColor(ACCENT).text("Compliance Guide");
    doc.moveDown(0.8);

    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(11)
      .text(state.intro, { align: "left", lineGap: 3 });
    doc.moveDown(0.6);

    const heading = (t) => {
      if (doc.y > doc.page.height - 150) doc.addPage();
      doc.moveDown(0.7);
      doc
        .fillColor(INK)
        .font("Helvetica-Bold")
        .fontSize(13.5)
        .text(t);
      doc
        .moveTo(L, doc.y + 3)
        .lineTo(L + 34, doc.y + 3)
        .lineWidth(2)
        .strokeColor(ACCENT)
        .stroke();
      doc.moveDown(0.5);
    };
    const body = (t) =>
      doc.fillColor(MUTED).font("Helvetica").fontSize(10.5).text(t, { lineGap: 3 });

    // Flowing marker + bold label + muted body, no absolute positioning.
    const marked = (marker, label, t) => {
      doc.font("Helvetica-Bold").fontSize(10.5);
      doc.fillColor(ACCENT).text(marker, { continued: true });
      doc.fillColor(INK).text(`${label}  `, { continued: true });
      doc.fillColor(MUTED).font("Helvetica").text(t, { lineGap: 2 });
      doc.moveDown(0.3);
    };
    const bullet = (label, t) => marked("•  ", label, t);
    const step = (n, label, t) => marked(`${n}.  `, label, t);

    // ── What changed ──────────────────────────────────────────────────────
    heading(`What changed for ${state.name} agents`);
    body(state.changed);

    // ── The form ──────────────────────────────────────────────────────────
    heading(`The ${state.name} form`);
    body(
      `In ${state.name}, buyer representation is documented with ${state.formName}. ` +
        `Confirm the current version with your broker and the ${state.commission} — ` +
        `form names and revisions change over time.`
    );

    // ── Must include ──────────────────────────────────────────────────────
    heading("Every written buyer agreement should include");
    bullet(
      "A signature before touring.",
      "Agents working through an MLS need the agreement signed before showing a home — in person or virtually."
    );
    bullet(
      "A specific compensation amount.",
      "The figure must be objective and agreed with your buyer — not open-ended, and not more than you both set."
    );
    bullet(
      "Clear scope and dates.",
      `The scope of representation and the time period should be spelled out, using ${state.formName}.`
    );
    bullet(
      "The buyer's signature on file.",
      "Keep a signed copy you can produce for your brokerage or a compliance check."
    );

    // ── Workflow ──────────────────────────────────────────────────────────
    heading("A simple compliant workflow");
    step(
      1,
      "Set expectations early.",
      "Explain buyer representation and why an agreement is required before you tour homes together."
    );
    step(2, "Present the agreement.", `Walk the buyer through ${state.formName}.`);
    step(
      3,
      "Agree compensation in writing.",
      "Enter a specific, objective amount you and the buyer accept."
    );
    step(
      4,
      "Sign before the first showing.",
      "Capture buyer and agent signatures — then you're clear to tour."
    );
    step(
      5,
      "Store and share.",
      "Keep the signed copy and export a PDF to your brokerage and buyer."
    );

    // ── FAQ ───────────────────────────────────────────────────────────────
    heading(`${state.name} buyer agreement FAQ`);
    state.faqs.forEach((f) => {
      if (doc.y > doc.page.height - 150) doc.addPage();
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(11).text(f.q, { lineGap: 2 });
      doc.fillColor(MUTED).font("Helvetica").fontSize(10.5).text(f.a, { lineGap: 3 });
      doc.moveDown(0.5);
    });

    // ── CTA ───────────────────────────────────────────────────────────────
    doc.moveDown(0.6);
    if (doc.y > doc.page.height - 160) doc.addPage();
    const boxTop = doc.y;
    doc
      .roundedRect(L, boxTop, W, 74, 8)
      .fillColor("#f4f5fb")
      .fill();
    doc
      .fillColor(INK)
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Get every buyer under agreement — from your phone", L + 18, boxTop + 14, {
        width: W - 36,
      });
    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(10)
      .text(
        `Threshold guides ${state.name} agents through ${state.formName}, captures signatures on-screen, and works offline. Download at auaha.app/threshold`,
        L + 18,
        boxTop + 34,
        { width: W - 36, lineGap: 2 }
      );
    doc.y = boxTop + 74;

    // ── Footer on every page ──────────────────────────────────────────────
    // Setting bottom margin to 0 stops pdfkit from auto-adding a page when we
    // write below the normal content area.
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      doc.page.margins.bottom = 0;
      const fy = doc.page.height - 44;
      doc
        .moveTo(L, fy)
        .lineTo(R, fy)
        .lineWidth(0.5)
        .strokeColor(LINE)
        .stroke();
      doc
        .fillColor(MUTED)
        .font("Helvetica")
        .fontSize(7.5)
        .text(
          "General information for real estate professionals — not legal advice. Confirm current requirements with your broker and state commission.",
          L,
          fy + 6,
          { width: W - 34, lineGap: 1, lineBreak: true }
        );
      doc
        .fillColor(MUTED)
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .text(`${i + 1}`, R - 22, fy + 6, {
          width: 22,
          align: "right",
          lineBreak: false,
        });
    }

    doc.end();
  });
}

for (const state of data.states) {
  await build(state);
  console.log(`✓ threshold/${state.slug}/${guideFileName(state)}`);
}
console.log(`\nDone — ${data.states.length} compliance guides generated.`);
