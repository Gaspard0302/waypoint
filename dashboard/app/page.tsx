import Link from "next/link";

const NPX_CMD = `npx waypoint-init`;

const steps = [
  {
    num: "01",
    title: "Run one command",
    body: "Sign up, create a site, then run `npx waypoint-init` in your project. It installs three skills into your coding agent in seconds.",
  },
  {
    num: "02",
    title: "Map your codebase",
    body: "Run `/waypoint-setup` in Claude Code, Mistral Vibe, or Cursor. The agent reads your source and builds an action map — every route, every button, every form.",
  },
  {
    num: "03",
    title: "Visitors just ask",
    body: 'A floating chat bubble appears. Visitor types "how do I upgrade?" — Waypoint navigates to the right page and clicks the right button.',
  },
];

const features = [
  {
    icon: "◈",
    title: "Embeddable anywhere",
    body: "One <script> tag works on any site — React, Next.js, Webflow, plain HTML. No SDK, no build step.",
  },
  {
    icon: "↗",
    title: "Takes real UI actions",
    body: "Navigates pages, clicks buttons. Not just text answers — the difference between knowing and doing.",
  },
  {
    icon: "⚡",
    title: "Source-indexed, not vision",
    body: "Your coding agent reads your source directly. Every route found, including auth-gated and dynamic pages no crawler can reach.",
  },
  {
    icon: "⊞",
    title: "Scoped & safe",
    body: "The agent is hard-limited to your domain. Your users stay on your site. Your brand stays in control.",
  },
];

const rows = [
  { name: "Intercom / Drift",  e: true,  a: false, p: false },
  { name: "OpenAI Operator",   e: false, a: true,  p: false },
  { name: "Google Mariner",    e: false, a: true,  p: false },
  { name: "Voiceflow",         e: true,  a: false, p: false },
  { name: "Waypoint",          e: true,  a: true,  p: true, highlight: true },
];

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "var(--font-body, sans-serif)" }}>
      <style>{`
        .wp-display { font-family: var(--font-display, Georgia, serif); }
        .wp-body    { font-family: var(--font-body, sans-serif); }

        /* Hero dot grid */
        .hero-dots {
          background-image: radial-gradient(circle, rgba(255,255,255,0.07) 1.5px, transparent 1.5px);
          background-size: 28px 28px;
        }
        /* Amber glow behind headline */
        .hero-glow {
          background: radial-gradient(ellipse 90% 55% at 50% 0%, rgba(251,191,36,0.13), transparent 65%);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .fu   { opacity: 0; animation: fadeUp 0.65s ease forwards; }
        .fu-1 { animation-delay: 0.05s; }
        .fu-2 { animation-delay: 0.2s;  }
        .fu-3 { animation-delay: 0.35s; }
        .fu-4 { animation-delay: 0.5s;  }

        @keyframes glow-pulse {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1;   }
        }
        .hero-glow { animation: glow-pulse 5s ease-in-out infinite; }

        .feature-card:hover {
          border-color: #d4d4d8;
          transform: translateY(-2px);
          transition: border-color 0.2s, transform 0.2s;
        }
        .feature-card { transition: border-color 0.2s, transform 0.2s; }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 md:px-12 bg-zinc-950/90 backdrop-blur border-b border-white/5">
        <span className="wp-display text-white text-xl tracking-tight">Waypoint</span>
        <Link
          href="/login"
          className="wp-body px-4 py-1.5 text-sm font-medium text-zinc-300 border border-zinc-700 rounded-full hover:text-white hover:border-zinc-400 transition-colors"
        >
          Sign in
        </Link>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen bg-zinc-950 flex flex-col justify-center overflow-hidden pt-16">
        <div className="hero-dots absolute inset-0 pointer-events-none" />
        <div className="hero-glow absolute inset-0 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-28 md:py-36">

          <div className="fu fu-1">
            <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Now in beta
            </span>
          </div>

          <h1 className="wp-display fu fu-2 text-[clamp(2.8rem,8vw,5.5rem)] leading-[1.04] font-normal text-white tracking-tight mb-7">
            Your website,<br />
            <em className="text-amber-400">guided by AI.</em>
          </h1>

          <p className="wp-body fu fu-3 text-zinc-400 text-lg md:text-xl max-w-xl leading-relaxed mb-10">
            One script tag. Visitors ask in plain English —{" "}
            <em className="text-zinc-200 not-italic">"how do I upgrade my plan?"</em>{" "}
            — and Waypoint navigates and clicks for them. Not a chatbot. An agent that{" "}
            <em className="text-zinc-200">acts</em>.
          </p>

          <div className="fu fu-4 flex flex-col sm:flex-row gap-4 items-start mb-16">
            <Link
              href="/signup"
              className="wp-body px-6 py-3 bg-amber-400 text-zinc-950 text-sm font-semibold rounded-lg hover:bg-amber-300 transition-colors"
            >
              Get started free →
            </Link>
          </div>

          {/* Code snippet */}
          <div className="fu fu-4">
            <p className="wp-body text-xs text-zinc-600 uppercase tracking-widest mb-3">Get started in seconds</p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 max-w-md">
              <div className="flex gap-1.5 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              </div>
              <pre className="text-sm text-zinc-300 font-mono whitespace-pre overflow-x-auto">{NPX_CMD}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="bg-white py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <p className="wp-body text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">How it works</p>
          <h2 className="wp-display text-4xl md:text-5xl text-zinc-900 mb-16">Three steps to a smarter site.</h2>

          <div className="grid md:grid-cols-3 gap-10 md:gap-14">
            {steps.map((s) => (
              <div key={s.num} className="flex flex-col gap-4">
                <span className="wp-display italic text-8xl text-zinc-100 leading-none select-none">{s.num}</span>
                <h3 className="wp-body text-base font-semibold text-zinc-900">{s.title}</h3>
                <p className="wp-body text-sm text-zinc-500 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section className="bg-zinc-50 py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <p className="wp-body text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">Why Waypoint</p>
          <h2 className="wp-display text-4xl md:text-5xl text-zinc-900 mb-16">Built different.</h2>

          <div className="grid sm:grid-cols-2 gap-5">
            {features.map((f) => (
              <div key={f.title} className="feature-card bg-white rounded-2xl p-8 border border-zinc-200">
                <span className="text-2xl text-amber-400 mb-5 block">{f.icon}</span>
                <h3 className="wp-body font-semibold text-zinc-900 mb-2">{f.title}</h3>
                <p className="wp-body text-sm text-zinc-500 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ─────────────────────────────────────── */}
      <section className="bg-white py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <p className="wp-body text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">Comparison</p>
          <h2 className="wp-display text-4xl md:text-5xl text-zinc-900 mb-16">Nothing else does all three.</h2>

          <div className="overflow-x-auto">
            <table className="w-full wp-body">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-4 pr-8 text-sm font-semibold text-zinc-900 w-1/2">Product</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-zinc-900">Embeddable</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-zinc-900">Takes UI actions</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-zinc-900">Source-indexed</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name} className={`border-b ${r.highlight ? "bg-amber-50 border-amber-100" : "border-zinc-100"}`}>
                    <td className={`py-4 pr-8 text-sm ${r.highlight ? "font-semibold text-zinc-900" : "text-zinc-600"}`}>
                      {r.name}
                      {r.highlight && (
                        <span className="ml-2 text-xs text-amber-600 font-medium">← you are here</span>
                      )}
                    </td>
                    {[r.e, r.a, r.p].map((v, i) => (
                      <td key={i} className={`py-4 px-4 text-center text-sm font-semibold ${r.highlight ? "text-amber-500" : "text-zinc-300"}`}>
                        {v ? "✓" : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────────── */}
      <section className="bg-zinc-950 py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6 md:px-12 text-center">
          <h2 className="wp-display text-4xl md:text-6xl text-white mb-6">
            Ready to guide<br />
            <em className="text-amber-400">every visitor?</em>
          </h2>
          <p className="wp-body text-zinc-400 text-lg max-w-sm mx-auto mb-10">
            Five minutes to set up. Zero friction for your visitors.
          </p>
          <Link
            href="/signup"
            className="wp-body inline-block px-8 py-4 bg-amber-400 text-zinc-950 font-semibold text-sm rounded-lg hover:bg-amber-300 transition-colors"
          >
            Get started free →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-8">
        <div className="max-w-5xl mx-auto px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="wp-display text-zinc-400 text-base">Waypoint</span>
          <p className="wp-body text-zinc-600 text-xs">© {new Date().getFullYear()} Waypoint. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
