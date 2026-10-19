"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactPage() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("sending");

    try {
      const res = await fetch("https://formspree.io/f/mqpazyee", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      if (res.ok) {
        form.reset();
        setStatus("sent");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const inputClass =
    "w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <main className="pb-20">
      <section className="max-w-xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Get in touch</h1>
          <p className="text-gray-600 mb-8">
            Have a question about league rules, weekly redrafts, scoring or the platform? Send us a message.
          </p>

          {status === "sent" ? (
            <div role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-5">
              <p className="font-semibold">Message sent</p>
              <p className="text-sm mt-1">Thanks for reaching out. We&apos;ll reply by email soon.</p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-4 text-sm font-semibold text-emerald-700 hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
                <input id="name" type="text" name="name" required className={inputClass} placeholder="Tiger Woods" />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input id="email" type="email" name="email" required className={inputClass} placeholder="tiger@example.com" />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea id="message" name="message" rows={4} required className={inputClass} placeholder="Your message..." />
              </div>

              {status === "error" && (
                <p role="alert" className="text-red-600 text-sm">
                  Your message didn&apos;t send. Check your connection and try again.
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full bg-emerald-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {status === "sending" ? "Sending..." : "Send message"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
