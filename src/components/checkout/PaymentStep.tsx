"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = pk ? loadStripe(pk) : null;

function PayForm({ orderId, total }: { orderId: string; total: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError("");
    const { error: err } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/order/${orderId}` },
    });
    // Only reached on immediate failure (card declined etc.) — success redirects.
    if (err) {
      setError(err.message ?? "Payment failed. You can retry, or pay at pickup — your order is saved.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={pay} className="card mt-8 space-y-5 p-6">
      <PaymentElement />
      {error && <p role="alert" className="text-sm text-[#b05436]">{error}</p>}
      <button type="submit" disabled={!stripe || busy} className="btn-green w-full disabled:opacity-60">
        {busy ? "Processing…" : `Pay $${total.toFixed(2)}`}
      </button>
      <p className="text-center text-xs opacity-50">
        Card, Apple Pay, or Google Pay · Or skip and{" "}
        <a href={`/order/${orderId}`} className="underline">pay at pickup instead</a> — your order is already in.
      </p>
    </form>
  );
}

export function PaymentStep({ clientSecret, orderId, total }: { clientSecret: string; orderId: string; total: number }) {
  if (!stripePromise) return null;
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          variables: { colorPrimary: "#1F4D3A", colorText: "#2B1B14", borderRadius: "12px", fontFamily: "Inter, sans-serif" },
        },
      }}
    >
      <PayForm orderId={orderId} total={total} />
    </Elements>
  );
}
