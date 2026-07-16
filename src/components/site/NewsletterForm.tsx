"use client";

import { useState } from "react";

type State = "idle" | "loading" | "done" | "error";

export function NewsletterForm() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function subscribe(formData: FormData) {
    setState("loading");
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.get("email") }),
    });
    if (res.ok) {
      setState("done");
      setMessage("You're in. First Ridge Report lands Sunday.");
    } else {
      const data = await res.json().catch(() => ({}));
      setState("error");
      setMessage(data.error ?? "Something went wrong. Try again.");
    }
  }

  if (state === "done") {
    return <p role="status" className="mt-8 font-button text-gold">{message}</p>;
  }

  return (
    <form action={subscribe} className="mx-auto mt-8 flex max-w-md gap-3">
      <label htmlFor="newsletter-email" className="sr-only">Email address</label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        placeholder="you@example.com"
        className="w-full rounded-full border border-himwhite/25 bg-himwhite/10 px-6 py-3.5 text-sm text-himwhite placeholder:text-himwhite/40"
      />
      <button type="submit" disabled={state === "loading"} className="btn-gold shrink-0 disabled:opacity-60">
        {state === "loading" ? "Joining…" : "Join"}
      </button>
      {state === "error" && <p role="alert" className="sr-only">{message}</p>}
    </form>
  );
}
