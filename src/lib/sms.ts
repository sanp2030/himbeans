/**
 * SMS via Twilio REST (no SDK). Gated by TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM:
 * without them, sends are logged and skipped — messaging can never block coffee.
 * Phones are stored E.164, so `to` is used as-is.
 */
import { log } from "./logger";

export function smsEnabled(): boolean {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);
}

export async function sendSms(to: string, body: string) {
  if (!smsEnabled()) {
    log("info", "sms.skipped_not_configured", { to, preview: body.slice(0, 60) });
    return;
  }
  try {
    const sid = process.env.TWILIO_ACCOUNT_SID!;
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: process.env.TWILIO_FROM!, Body: body }),
    });
    if (!res.ok) log("warn", "sms.send_failed", { to, status: res.status });
    else log("info", "sms.sent", { to });
  } catch (e) {
    log("error", "sms.send_error", { to, message: e instanceof Error ? e.message : "unknown" });
  }
}

export const smsTemplates = {
  confirmed: (n: number, code: string, eta: number | null, url: string) =>
    `HimBean: order #${n} confirmed. Pickup code ${code}${eta ? `, ~${eta} min` : ""}. Track: ${url}`,
  ready: (n: number, code: string) =>
    `HimBean: order #${n} is READY. Show code ${code} at the counter.`,
  collected: (n: number) =>
    `HimBean: order #${n} collected. Enjoy — see you tomorrow? ☕`,
};
