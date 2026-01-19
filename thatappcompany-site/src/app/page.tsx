"use client";

import { APPS, type AppItem } from "@/lib/apps";
import { UPDATES } from "@/lib/updates";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Live: "border-emerald-400/40 text-emerald-200 bg-emerald-500/10",
    Beta: "border-sky-400/40 text-sky-200 bg-sky-500/10",
    "In Dev": "border-indigo-400/40 text-indigo-200 bg-indigo-500/10"
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs", map[status] || "border-slate-200 text-slate-700 bg-slate-50")}>
      {status}
    </span>
  );
}

function GradientGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-32 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full blur-3xl opacity-30
        bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.9),rgba(37,99,235,0.5),rgba(2,6,23,0))]" />
      <div className="absolute top-24 right-[-220px] h-[520px] w-[520px] rounded-full blur-3xl opacity-20
        bg-[radial-gradient(circle_at_center,rgba(30,64,175,0.9),rgba(2,6,23,0))]" />
    </div>
  );
}

// --- NEW CREATIVE COMPONENTS ---

function FloatingPrompt({ text, x, y, delay }: { text: string; x: number; y: number; delay: number }) {
  return (
    <motion.div
      className="absolute cursor-grab active:cursor-grabbing z-20"
      initial={{ opacity: 0, x, y }}
      animate={{ opacity: 1, y: y + 15 }}
      transition={{
        y: { duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay },
        opacity: { duration: 0.8, delay: 0.5 }
      }}
      drag
      dragConstraints={{ left: x - 50, right: x + 50, top: y - 50, bottom: y + 50 }}
    >
      <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-slate-900 shadow-lg backdrop-blur-md border border-slate-200 hover:scale-110 hover:border-blue-400 transition-all">
        {text} ?
      </div>
    </motion.div>
  );
}

function SelectionHero({ app }: { app: AppItem }) {
  return (
    <div className="relative mt-10 h-[500px] w-full flex items-center justify-center overflow-visible">
      {/* Background Glow */}
      <div className="absolute inset-0 rounded-[44px] border border-slate-200 bg-white overflow-hidden">
        <GradientGlow />
        {/* Subtle moving strokes */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.15]" viewBox="0 0 100 100" preserveAspectRatio="none">
          <motion.path d="M0 50 Q 50 100 100 50" stroke="black" strokeWidth="0.5" fill="none"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 4, repeat: Infinity, repeatType: "mirror" }} />
          <motion.path d="M0 30 Q 50 80 100 30" stroke="blue" strokeWidth="0.5" fill="none"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 5, repeat: Infinity, repeatType: "mirror", delay: 1 }} />
        </svg>
      </div>

      {/* Floating Creative Prompts - Pushed Far Out */}
      <FloatingPrompt text="Is it essential" x={-420} y={-160} delay={0} />
      <FloatingPrompt text="Can it be simpler" x={420} y={-120} delay={1.2} />
      <FloatingPrompt text="Who is this for" x={-380} y={150} delay={2.5} />
      <FloatingPrompt text="What is the friction" x={400} y={110} delay={3.1} />

      <div className="relative z-10 text-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-600 mb-6">
            ✨ Only Everything in its place
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-slate-900 sm:text-7xl">
            Questions are at the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500">center of our workflow.</span>
          </h1>
          <p className="mt-8 text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Unleashing creative habits and questions.
            <br />Curating digital tools for the connected garage.
          </p>
        </motion.div>

        <motion.div
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <a href="#projects" className="group relative inline-flex h-14 w-full sm:w-auto items-center justify-center overflow-hidden rounded-full bg-slate-900 px-8 font-bold text-white shadow-xl transition-all hover:bg-blue-600">
            <span className="relative z-10 mr-2">Showcase Portfolio</span>
            <span className="relative z-10 transition-transform group-hover:translate-x-1">→</span>
          </a>
          <a href="#creative-process" className="inline-flex h-14 w-full sm:w-auto items-center justify-center rounded-full border border-slate-200 bg-white px-8 font-bold text-slate-900 transition-colors hover:bg-slate-50">
            See Our Approach
          </a>
        </motion.div>
      </div>
    </div>
  );
}

// --- 3-STEP CREATIVE PROCESS ---
function CreativeProcess() {
  const steps = [
    {
      step: "01",
      title: "Invert",
      desc: "Look at the problem backwards. What if the user does less?",
      color: "text-blue-500"
    },
    {
      step: "02",
      title: "Solve",
      desc: "Ask the right questions. Strip away the noise.",
      color: "text-purple-500"
    },
    {
      step: "03",
      title: "Create",
      desc: "Engineer the solution. Ship with elegance.",
      color: "text-emerald-500"
    }
  ];

  return (
    <section id="creative-process" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight mb-16">The Creative Engine</h2>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              className="relative flex flex-col items-center justify-center rounded-[40px] border border-slate-200 bg-white p-10 shadow-xl transition-transform hover:-translate-y-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
            >
              <div className={`text-xs font-bold uppercase tracking-widest ${s.color} mb-4`}>Habit #{s.step}</div>
              <div className="text-4xl font-black tracking-tighter text-slate-900 mb-6">{s.title}</div>
              <p className="text-lg text-slate-500 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}

async function subscribe(email: string) {
  const res = await fetch("/api/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, source: "thatappcompany.co" })
  });
  return res.json();
}

export default function Page() {
  const app = APPS[0];
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const keyUpdates = useMemo(() => UPDATES.slice(0, 3), []);

  return (
    <main className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">

      {/* Background Dots */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-10">
        <header className="flex items-center justify-between mb-8">
          <div className="text-sm font-bold tracking-tight uppercase">ThatAppCompany</div>
          <nav className="hidden items-center gap-6 text-xs font-medium uppercase tracking-wide text-slate-500 md:flex">
            <a href="#projects" className="hover:text-slate-900 transition-colors">Portfolio</a>
            <a href="#creative-deck" className="hover:text-slate-900 transition-colors">Habits</a>
            <a href="#updates" className="hover:text-slate-900 transition-colors">Logs</a>
          </nav>
        </header>

        <SelectionHero app={app} />

        <CreativeProcess />

        {/* Studio Philosophy Section */}
        <section className="relative mt-24 overflow-hidden rounded-[44px] bg-[#0A0A0B] px-8 py-20 text-white shadow-2xl">
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute left-1/2 top-[-220px] h-[600px] w-[600px] -translate-x-1/2 rounded-full blur-[100px]
              bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.3),rgba(0,0,0,0))]" />
          </div>

          <div className="relative mx-auto max-w-4xl text-center">
            <div className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-widest text-slate-300 backdrop-blur">
              Our Process
            </div>
            <h2 className="mt-6 text-4xl font-semibold tracking-tighter sm:text-5xl">
              We don't just build apps.<br />
              <span className="text-slate-500">We solve workflow friction.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
              The App Company exists to observe complex, messy real-world processes and engineer elegance into them.
              Our flagship, <em>Garage Manager</em>, is proof of concept.
            </p>
          </div>

          <div className="relative mx-auto mt-20 grid max-w-5xl gap-6 md:grid-cols-3">
            <motion.div
              className="group rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur transition-colors hover:border-white/20 hover:bg-white/10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="text-sm font-mono text-blue-400 opacity-80">01. Observe</div>
              <div className="mt-3 text-lg font-medium text-white">We find the receipts in the shoebox. The friction points.</div>
            </motion.div>
            <motion.div
              className="group rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur transition-colors hover:border-white/20 hover:bg-white/10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-sm font-mono text-blue-400 opacity-80">02. Engineer</div>
              <div className="mt-3 text-lg font-medium text-white">We apply studio-grade design to replace manual grunt work.</div>
            </motion.div>
            <motion.div
              className="group rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur transition-colors hover:border-white/20 hover:bg-white/10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-sm font-mono text-blue-400 opacity-80">03. Ship</div>
              <div className="mt-3 text-lg font-medium text-white">We deploy tools that feel like upgrades. Fast and clean.</div>
            </motion.div>
          </div>
        </section>

        <section id="projects" className="mt-24 px-4">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-semibold tracking-tight">Active Projects</h3>
              <p className="mt-2 text-slate-500">Currently in the lab.</p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {/* Garage Manager Card */}
            <motion.a
              href={`/apps/${app.slug}`}
              className="group relative overflow-hidden rounded-[40px] border border-slate-200 bg-slate-50 p-10 hover:border-slate-300 hover:shadow-xl transition-all"
              whileHover={{ y: -4 }}
            >
              <div className="absolute right-[-40px] top-[-40px] h-[200px] w-[200px] rounded-full bg-blue-100/50 blur-3xl transition-transform group-hover:scale-150" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold">GM</div>
                    <span className="font-semibold text-lg">{app.name}</span>
                  </div>
                  <StatusPill status={app.status} />
                </div>

                <p className="mt-6 text-xl font-medium leading-relaxed text-slate-800">
                  {app.oneLiner}
                </p>

                <div className="mt-8 flex flex-wrap gap-2">
                  {app.tags.map((t) => (
                    <span key={t} className="rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">{t}</span>
                  ))}
                </div>

                <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-slate-900 group-hover:gap-3 transition-all">
                  View Project <span className="text-xl">→</span>
                </div>
              </div>
            </motion.a>

            {/* Updates Card */}
            <motion.a
              href={`/apps/${app.slug}/updates`}
              className="group flex flex-col justify-between rounded-[40px] border border-slate-200 bg-white p-10 hover:border-slate-300 hover:shadow-xl transition-all"
              whileHover={{ y: -4 }}
            >
              <div>
                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Changelog</div>
                <div className="mt-2 text-2xl font-semibold">What's Shipping?</div>
                <p className="mt-4 text-slate-600">
                  Studio logs and weekly improvements.
                </p>
              </div>

              <div className="mt-8 space-y-3">
                {keyUpdates.map(u => (
                  <div key={u.id} className="flex items-center gap-3 text-sm text-slate-500">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <span className="font-medium text-slate-700">{u.title}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-slate-900 group-hover:gap-3 transition-all">
                Full Timeline <span className="text-xl">→</span>
              </div>
            </motion.a>
          </div>
        </section>

        <section id="contact" className="mt-24 mb-10 rounded-[44px] bg-[#0A0A0B] p-12 text-white overflow-hidden relative">
          <div className="relative z-10 grid gap-10 md:grid-cols-2 items-center">
            <div>
              <h3 className="text-3xl font-semibold tracking-tight">The Inner Circle</h3>
              <p className="mt-4 text-slate-400 text-lg leading-relaxed">
                We don't spam. We share things we find interesting, workflow breakthroughs, and early access to betas.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-base outline-none placeholder:text-slate-500 focus:border-blue-500/50 transition-colors"
                placeholder="enter@your.email"
              />
              <button
                className="w-full rounded-2xl bg-white px-6 py-4 text-base font-bold text-black hover:bg-slate-200 transition-colors"
                onClick={async () => {
                  setMsg(null);
                  try {
                    const out = await subscribe(email);
                    if (out?.ok) setMsg("Welcome to the studio.");
                    else setMsg(out?.error || "Could not subscribe.");
                  } catch {
                    setMsg("Could not subscribe.");
                  }
                }}
              >
                Join the List
              </button>
              {msg && <div className="text-center text-sm text-blue-300 font-medium">{msg}</div>}
            </div>
          </div>
        </section>

        <footer className="mt-20 border-t border-slate-100 pt-10 text-center text-sm text-slate-400">
          <p>© 2026 ThatAppCompany. All systems nominal.</p>
        </footer>
      </div>
    </main>
  );
}
