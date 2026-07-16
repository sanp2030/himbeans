/**
 * Transactional email via Resend HTTP API (no SDK dependency).
 * Gated by RESEND_API_KEY: when absent, the send is logged and skipped so the
 * commerce flow never depends on email availability.
 */
import { log } from "./logger";

export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

async function send(to: string, subject: string, html: string) {
  if (!emailEnabled()) {
    log("info", "email.skipped_not_configured", { to, subject });
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "HimBean <hello@himbean.coffee>", to, subject, html }),
    });
    if (!res.ok) log("warn", "email.send_failed", { to, subject, status: res.status });
    else log("info", "email.sent", { to, subject });
  } catch (e) {
    log("error", "email.send_error", { to, message: e instanceof Error ? e.message : "unknown" });
  }
}

const wrap = (body: string) => `
<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:32px;color:#2B1B14;background:#FAF8F4">
  <p style="letter-spacing:4px;font-size:11px;color:#C8A951;font-family:Arial,sans-serif">HIMBEAN</p>
  ${body}
  <p style="margin-top:36px;font-size:12px;color:#2B1B14;opacity:.5;font-family:Arial,sans-serif">
    HimBean Coffee Pvt. Ltd. · 12 Lantern Row, Kathmandu · Coffee, elevated by the Himalayas.
  </p>
</div>`;

export function orderConfirmationHtml(o: {
  number: number; pickupCode: string | null; etaMinutes: number | null; total: number;
  items: { quantity: number; name: string }[]; trackingUrl: string;
}) {
  return wrap(`
  <h1 style="font-size:26px;margin:8px 0">Your order is confirmed.</h1>
  <p>Order <b>#${o.number}</b>${o.etaMinutes ? ` · ready in about ${o.etaMinutes} minutes` : ""}.</p>
  <div style="background:#fff;border:1px solid #e5ded2;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
    <p style="font-size:11px;letter-spacing:3px;font-family:Arial,sans-serif;opacity:.5;margin:0">PICKUP CODE</p>
    <p style="font-size:30px;letter-spacing:8px;font-family:Courier,monospace;margin:8px 0 0">${o.pickupCode ?? "—"}</p>
  </div>
  <ul style="padding-left:18px">${o.items.map((i) => `<li>${i.quantity}× ${i.name}</li>`).join("")}</ul>
  <p><b>Total: $${o.total.toFixed(2)}</b> (incl. 13% tax)</p>
  <p><a href="${o.trackingUrl}" style="color:#1F4D3A">Track your order live →</a></p>`);
}

export function receiptHtml(o: { number: number; total: number; subtotal: number; tax: number; provider: string }) {
  return wrap(`
  <h1 style="font-size:26px;margin:8px 0">Payment receipt</h1>
  <p>Order <b>#${o.number}</b> — paid via ${o.provider}.</p>
  <table style="width:100%;font-size:14px;border-collapse:collapse">
    <tr><td style="padding:4px 0;opacity:.6">Subtotal</td><td style="text-align:right">$${o.subtotal.toFixed(2)}</td></tr>
    <tr><td style="padding:4px 0;opacity:.6">Tax (13%)</td><td style="text-align:right">$${o.tax.toFixed(2)}</td></tr>
    <tr><td style="padding:8px 0;border-top:1px solid #e5ded2"><b>Total</b></td><td style="text-align:right;border-top:1px solid #e5ded2"><b>$${o.total.toFixed(2)}</b></td></tr>
  </table>`);
}

export const sendEmail = send;
