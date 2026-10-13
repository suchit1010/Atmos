import type { ProofResult, Verdict } from "./proof";

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (value: unknown): string => String(value).replace(/[&<>"']/g, (c) => ESCAPES[c] ?? c);

const BADGE: Record<Verdict, { label: string; cls: string }> = {
  intact: { label: "INTACT", cls: "ok" },
  tampered: { label: "CHANGED", cls: "bad" },
  pending_anchor: { label: "NOT ANCHORED YET", cls: "warn" },
  anchor_invalid: { label: "ANCHOR NOT CONFIRMED", cls: "bad" },
  chain_unavailable: { label: "SOLANA UNREACHABLE", cls: "warn" },
};

const CSS = `
:root{--bg:#fbfaf6;--fg:#1c2218;--muted:#5b6556;--card:#fff;--line:#dcd8cb;--ok:#1e6b3a;--okbg:#e5f3ea;--bad:#a1281d;--badbg:#fbe9e6;--warn:#8a5a00;--warnbg:#fff3d6}
@media (prefers-color-scheme:dark){:root{--bg:#12150f;--fg:#ecefe6;--muted:#a3ab9b;--card:#1b2017;--line:#33392d;--ok:#7bd49a;--okbg:#17301f;--bad:#ff9d92;--badbg:#3a1a16;--warn:#f2c35b;--warnbg:#352a0c}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:720px;margin:0 auto;padding:20px 16px 48px}
h1{font-size:1.3rem;margin:0 0 4px}h2{font-size:1.05rem;margin:28px 0 8px}
.sub{color:var(--muted);margin:0 0 16px;word-break:break-all}
.banner{border-radius:12px;padding:16px;border:2px solid;margin:12px 0}
.banner.ok{background:var(--okbg);border-color:var(--ok)}.banner.bad{background:var(--badbg);border-color:var(--bad)}.banner.warn{background:var(--warnbg);border-color:var(--warn)}
.badge{font-weight:700;letter-spacing:.04em;font-size:.85rem}.ok .badge{color:var(--ok)}.bad .badge{color:var(--bad)}.warn .badge{color:var(--warn)}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin:8px 0}
.hash{font:13px ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all}
.row{margin:6px 0}.label{display:block;color:var(--muted);font-size:.85rem}
table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:6px 4px;border-bottom:1px solid var(--line);vertical-align:top;font-size:.92rem}
.pill{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:0 8px;font-size:.8rem;margin-right:6px}
a{color:inherit}ol,ul{padding-left:20px}code,pre{font:13px ui-monospace,SFMono-Regular,Menlo,monospace}pre{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:10px;overflow-x:auto}
.fine{color:var(--muted);font-size:.85rem}
`;

function link(href: string | undefined, text: string): string {
  return href ? `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>` : esc(text);
}

function when(ms: number | null | undefined): string {
  return ms ? new Date(ms * 1000).toISOString() : "";
}

export function renderProofPage(proof: ProofResult, baseUrl: string): string {
  const badge = BADGE[proof.verdict];
  const a = proof.anchor;
  const s = proof.summary;
  const hashLine = (label: string, value: string | undefined) =>
    `<div class="row"><span class="label">${esc(label)}</span><span class="hash">${value ? esc(value) : "not available"}</span></div>`;

  const hashes = a
    ? `<div class="card">
        ${hashLine("Hash written to Solana", a.chainHash ?? a.anchoredHash)}
        ${hashLine("Hash of this evidence pack, computed just now", a.recomputedHash)}
        <div class="row"><span class="label">Result</span><strong>${
          a.chainHash
            ? a.chainHash === a.recomputedHash
              ? "They are the same."
              : "They are different."
            : "Could not be compared."
        }</strong></div>
        <div class="row"><span class="label">Transaction</span>${link(a.explorerUrl, `${a.signature.slice(0, 16)}… on Solana ${proof.network}`)}</div>
        <div class="row"><span class="label">Written by</span>${link(a.authorityUrl, a.authority)}</div>
        ${a.blockTime ? `<div class="row"><span class="label">Block time (UTC)</span>${esc(when(a.blockTime))}</div>` : ""}
      </div>`
    : `<div class="card">Nothing has been written to Solana for this batch yet.</div>`;

  const checks = s.checks
    .map((c) => `<tr><td><span class="pill">${esc(c.id)}</span></td><td><strong>${esc(c.result)}</strong></td><td>${esc(c.reason)}</td></tr>`)
    .join("");

  const photos = proof.photos
    .map(
      (p) =>
        `<tr><td>${esc(p.kind)}</td><td class="hash">${esc(p.sha256)}</td><td>${p.matches ? "file matches" : "file does not match"}</td></tr>`,
    )
    .join("");

  const payouts = proof.payouts.length
    ? `<table><tr><th>Tranche</th><th>Amount</th><th>Status</th><th>Transaction</th></tr>${proof.payouts
        .map(
          (p) =>
            `<tr><td>${p.tranche}</td><td>${esc(p.amountDisplay)}<br><span class="fine">to ${esc(p.recipient)}</span></td><td>${esc(p.status)}</td><td>${link(p.explorerUrl, p.signature ? `${p.signature.slice(0, 10)}…` : "")}</td></tr>`,
        )
        .join("")}</table>`
    : `<div class="card">No payout has been sent yet.</div>`;

  const base = esc(baseUrl);
  const id = esc(proof.batchId);

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Atmos proof ${id}</title><meta name="robots" content="noindex"><style>${CSS}</style></head>
<body><main>
<h1>Atmos evidence proof</h1>
<p class="sub">Batch ${id} · Solana ${esc(proof.network)}</p>
<div class="banner ${badge.cls}" role="status"><div class="badge">${esc(badge.label)}</div><div>${esc(proof.verdictText)}</div></div>
${hashes}

<h2>What this batch claims</h2>
<div class="card">
  <div class="row"><span class="label">Estimated carbon stored for 100 years</span><strong>${esc(s.finalKgCO2e)} kg CO2e</strong> <span class="fine">(range ${esc(s.finalLowKgCO2e)} to ${esc(s.finalHighKgCO2e)})</span></div>
  <div class="row"><span class="label">Methane from the burn, reported separately</span>${esc(s.methaneKgCO2e)} kg CO2e</div>
  <div class="row"><span class="label">Feedstock and volume</span>${esc(s.feedstock)}, ${esc(s.volumeL)} L, started ${esc(s.startedAt)}</div>
  <p class="fine">This is an estimate from a guideline formula. It is not a carbon credit. Atmos does not issue credits.</p>
</div>

<h2>Checks that ran</h2>
<div class="card"><table>${checks}</table></div>

<h2>Photos</h2>
<div class="card"><table>${photos}</table><p class="fine">Only the fingerprints are public. The photos stay private.</p></div>

<h2>Payouts to the farmer</h2>
${payouts}
${proof.registry ? `<div class="card"><strong>Registry step is simulated.</strong> ${esc(proof.registry.note)}</div>` : ""}

<h2>Check it yourself</h2>
<ol>
  <li>Download the exact text that was hashed: <code>curl -s ${base}/api/proof/${id}/canonical -o pack.json</code></li>
  <li>Hash it: <code>sha256sum pack.json</code></li>
  <li>Open the Solana transaction above. The memo reads <code>ATMOS1|${id}|&lt;hash&gt;</code>. The two hashes must be identical.</li>
</ol>
<p class="fine">Machine-readable version: <a href="${base}/api/proof/${id}">${base}/api/proof/${id}</a></p>

<h2>What this does not prove</h2>
<ul>${proof.disclosures.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
</main></body></html>`;
}

export function renderNotFoundPage(): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Proof not found</title><style>${CSS}</style></head><body><main><h1>Proof not found</h1><p class="sub">There is no accepted batch with this id.</p></main></body></html>`;
}
