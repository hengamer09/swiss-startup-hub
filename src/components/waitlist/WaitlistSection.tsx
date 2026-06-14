"use client";

import WaitlistButton from "./WaitlistButton";

export default function WaitlistSection() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-2xl px-4">
        <div className="rounded-md border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-2xl font-semibold text-zinc-900">🚀 Join the Waitlist</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
            Be the first to know when we launch new features. Get early access and
            connect with the Swiss startup community.
          </p>
          <div className="mt-6 flex justify-center">
            <WaitlistButton variant="primary">Join the Waitlist</WaitlistButton>
          </div>
        </div>
      </div>
    </section>
  );
}
