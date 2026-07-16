"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart";
import { PaymentStep } from "./PaymentStep";
import { PHONE_COUNTRIES, namePattern, type PhoneCountry } from "@/lib/validators";

type Location = { id: string; name: string; address: string };

const STRIPE_PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export function CheckoutForm() {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState<PhoneCountry>("NP");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [payMethod, setPayMethod] = useState<"counter" | "card" | "gift">("counter");
  const [giftCode, setGiftCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErr, setFieldErr] = useState<{ name?: string; phone?: string }>({});
  const [mounted, setMounted] = useState(false);
  const [payment, setPayment] = useState<{ clientSecret: string; orderId: string; total: number } | null>(null);

  useEffect(() => {
    setMounted(true);
    fetch("/api/locations")
      .then((r) => r.json())
      .then((d) => {
        setLocations(d.locations ?? []);
        if (d.locations?.[0]) setLocationId(d.locations[0].id);
        else setError("Online ordering isn't available right now — no pickup location is configured. Please try again shortly or order at the counter.");
      })
      .catch(() => setError("Couldn't load pickup locations. Please refresh."));
  }, []);

  if (!mounted) return null;

  if (payment) {
    return (
      <>
        <p className="mt-4 opacity-70">Order placed — complete your payment below.</p>
        <PaymentStep clientSecret={payment.clientSecret} orderId={payment.orderId} total={payment.total} />
      </>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card mt-8 p-10 text-center">
        <p className="font-display text-xl">Your cart is empty</p>
        <a href="/menu" className="btn-green mt-6">Browse the menu</a>
      </div>
    );
  }

  const tax = +(subtotal() * 0.13).toFixed(2);
  const total = +(subtotal() + tax).toFixed(2);

  function validate(): boolean {
    const errs: typeof fieldErr = {};
    if (!namePattern.test(name.trim())) errs.name = "Enter your real name (2–80 letters).";
    if (!/^\d{10}$/.test(phone.trim())) errs.phone = `Enter exactly 10 digits after ${PHONE_COUNTRIES[country].code} — we text your order updates here.`;
    setFieldErr(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!locationId) {
      setError("Online ordering isn't available right now — please try again shortly.");
      return;
    }
    if (!validate()) return;
    setSubmitting(true);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locationId,
        fulfilment: "PICKUP",
        guestName: name.trim(),
        guestPhoneCountry: country,
        guestPhone: phone.trim(),
        guestEmail: email || undefined,
        scheduledFor: pickupTime ? new Date(pickupTime).toISOString() : undefined,
        payOnline: payMethod === "card",
        giftCardCode: payMethod === "gift" && giftCode ? giftCode : undefined,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, customization: i.customization })),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    clear();
    if (data.clientSecret) {
      setPayment({ clientSecret: data.clientSecret, orderId: data.id, total: Number(data.amountDue ?? data.total) });
      setSubmitting(false);
      return;
    }
    router.push(`/order/${data.id}`);
  }

  const inputCls = "mt-1.5 w-full rounded-xl border bg-[var(--card)] px-4 py-3";
  const lbl = "font-button text-xs uppercase tracking-[0.18em] opacity-60";

  return (
    <form onSubmit={submit} className="mt-8 space-y-6" noValidate>
      <div className="card space-y-4 p-6">
        <div>
          <label htmlFor="co-name" className={lbl}>Name *</label>
          <input id="co-name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(fieldErr.name)} aria-describedby={fieldErr.name ? "co-name-err" : undefined}
            className={inputCls} style={{ borderColor: fieldErr.name ? "#b05436" : "var(--line)" }} />
          {fieldErr.name && <p id="co-name-err" role="alert" className="mt-1.5 text-xs text-[#b05436]">{fieldErr.name}</p>}
        </div>
        <div>
          <label htmlFor="co-phone" className={lbl}>Mobile * <span className="normal-case tracking-normal">(order updates by SMS)</span></label>
          <div className="mt-1.5 flex gap-2">
            <select aria-label="Country code" value={country} onChange={(e) => setCountry(e.target.value as PhoneCountry)}
              className="rounded-xl border bg-[var(--card)] px-3 py-3" style={{ borderColor: "var(--line)" }}>
              {Object.entries(PHONE_COUNTRIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <input id="co-phone" required inputMode="numeric" pattern="\d{10}" maxLength={10} placeholder="98XXXXXXXX"
              value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              aria-invalid={Boolean(fieldErr.phone)} aria-describedby={fieldErr.phone ? "co-phone-err" : undefined}
              className="w-full rounded-xl border bg-[var(--card)] px-4 py-3"
              style={{ borderColor: fieldErr.phone ? "#b05436" : "var(--line)" }} />
          </div>
          {fieldErr.phone && <p id="co-phone-err" role="alert" className="mt-1.5 text-xs text-[#b05436]">{fieldErr.phone}</p>}
        </div>
        <div>
          <label htmlFor="co-email" className={lbl}>Email (for your receipt)</label>
          <input id="co-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className={inputCls} style={{ borderColor: "var(--line)" }} />
        </div>
        <div>
          <label htmlFor="co-time" className={lbl}>Pickup time (optional — default ASAP)</label>
          <input id="co-time" type="datetime-local" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)}
            className={inputCls} style={{ borderColor: "var(--line)" }} />
        </div>
        {locations.length > 1 && (
          <div>
            <label htmlFor="co-loc" className={lbl}>Pickup location</label>
            <select id="co-loc" value={locationId} onChange={(e) => setLocationId(e.target.value)}
              className={inputCls} style={{ borderColor: "var(--line)" }}>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Payment method */}
      <fieldset className="card space-y-4 p-6">
        <legend className="sr-only">Payment method</legend>
        <label className="flex cursor-pointer items-start gap-3">
          <input type="radio" name="pay" checked={payMethod === "counter"} onChange={() => setPayMethod("counter")} className="mt-1" />
          <span><span className="font-semibold">Pay at pickup</span>
            <span className="block text-sm opacity-60">Cash or card at the counter</span></span>
        </label>
        <label className={`flex items-start gap-3 ${STRIPE_PK ? "cursor-pointer" : "opacity-40"}`}>
          <input type="radio" name="pay" disabled={!STRIPE_PK} checked={payMethod === "card"} onChange={() => setPayMethod("card")} className="mt-1" />
          <span><span className="font-semibold">Credit / debit / prepaid card</span>
            <span className="block text-sm opacity-60">{STRIPE_PK ? "Cards, Apple Pay, Google Pay" : "Coming online soon"}</span></span>
        </label>
        <label className="flex cursor-pointer items-start gap-3">
          <input type="radio" name="pay" checked={payMethod === "gift"} onChange={() => setPayMethod("gift")} className="mt-1" />
          <span className="w-full"><span className="font-semibold">HimBean gift card</span>
            <span className="block text-sm opacity-60">Remaining balance (if any) is paid at pickup{STRIPE_PK ? " or by card" : ""}</span>
            {payMethod === "gift" && (
              <input aria-label="Gift card code" placeholder="HB-GIFT-XXXX" value={giftCode}
                onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                className="mt-2 w-full rounded-xl border bg-[var(--card)] px-4 py-2.5 font-mono text-sm tracking-widest"
                style={{ borderColor: "var(--line)" }} />
            )}
          </span>
        </label>
      </fieldset>

      {/* Summary */}
      <div className="card p-6">
        <ul className="space-y-1.5 text-sm">
          {items.map((i) => (
            <li key={i.productId + JSON.stringify(i.customization ?? {})} className="flex justify-between">
              <span>{i.quantity}× {i.name}</span>
              <span className="font-button">${(i.price * i.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t pt-3 text-sm" style={{ borderColor: "var(--line)" }}>
          <p className="flex justify-between opacity-60"><span>Subtotal</span><span>${subtotal().toFixed(2)}</span></p>
          <p className="flex justify-between opacity-60"><span>Tax (13%)</span><span>${tax.toFixed(2)}</span></p>
          <p className="flex justify-between font-button text-base font-semibold"><span>Total</span><span>${total.toFixed(2)}</span></p>
          {payMethod === "gift" && <p className="text-xs opacity-50">Gift card balance is applied at order time; you&apos;ll see the exact amount due on confirmation.</p>}
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-[#b05436]">{error}</p>}

      <button type="submit" disabled={submitting} className="btn-green w-full disabled:opacity-60">
        {submitting ? "Placing your order…" : `Place order · $${total.toFixed(2)}`}
      </button>
      <p className="text-center text-xs opacity-45">Order updates by SMS · Pickup in 7–12 min</p>
    </form>
  );
}
