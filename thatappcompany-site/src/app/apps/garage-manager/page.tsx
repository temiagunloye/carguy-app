import { APPS } from "@/lib/apps";
import Image from "next/image";

export default function GarageManagerPage() {
    const app = APPS[0];
    const targetUrl = process.env.NEXT_PUBLIC_GM_TARGET_URL || "https://garagemanager.co";

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            {/* Header */}
            <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <a href="/" className="text-sm font-bold uppercase tracking-wide">ThatAppCompany</a>
                    <nav className="flex items-center gap-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        <a href="#showcase" className="hover:text-slate-900">Showcase</a>
                        <a href={`/apps/${app.slug}/updates`} className="hover:text-slate-900">Updates</a>
                    </nav>
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-6 py-12">

                {/* Hero Card */}
                <section className="rounded-[44px] bg-slate-900 p-12 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-[200px] bg-blue-600/20 blur-[100px] rounded-full" />

                    <div className="relative z-10 grid gap-8 md:grid-cols-2 items-center">
                        <div>
                            <div className="inline-block rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase text-blue-400">
                                Flagship App
                            </div>
                            <h1 className="mt-6 text-5xl font-black tracking-tighter sm:text-7xl">{app.name}</h1>
                            <p className="mt-6 text-xl text-slate-400 leading-relaxed max-w-lg">{app.oneLiner}</p>

                            <div className="mt-10 flex flex-wrap gap-4">
                                <a href={targetUrl} target="_blank" className="rounded-full bg-white px-8 py-4 text-base font-bold text-slate-900 hover:bg-blue-50 transition-colors">
                                    Launch Website →
                                </a>
                                <a href={`/apps/${app.slug}/updates`} className="rounded-full border border-slate-700 bg-slate-800 px-8 py-4 text-base font-bold text-white hover:bg-slate-700 transition-colors">
                                    View Log
                                </a>
                            </div>
                        </div>
                        {/* Placeholder generic graphic if needed, or just text layout */}
                    </div>
                </section>

                {/* VISUAL SHOWCASE */}
                <section id="showcase" className="mt-24">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold tracking-tight">The Operating System for your Build</h2>
                        <p className="mt-4 text-slate-500 text-lg">
                            We engineered a system that tracks parts, history, and status with zero friction.
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        {[
                            { src: "/showcase/gm-01.png", label: "Inventory Tracking" },
                            { src: "/showcase/gm-02.png", label: "Build History" },
                            { src: "/showcase/gm-03.png", label: "Visual Planner" }
                        ].map((img, i) => (
                            <div key={i} className="group relative aspect-[9/19] w-full overflow-hidden rounded-[32px] border border-slate-200 bg-slate-100 shadow-md transition-all hover:-translate-y-2 hover:shadow-xl">
                                <Image
                                    src={img.src}
                                    alt={img.label}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                                <div className="absolute bottom-6 left-6 text-white text-lg font-bold opacity-0 transition-opacity group-hover:opacity-100">
                                    {img.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mt-24 mb-10 grid gap-6 md:grid-cols-3">
                    {[
                        { title: "Discover", desc: "Bring your inventory into one place." },
                        { title: "Manage", desc: "Track cars, parts, and status cleanly." },
                        { title: "Automate", desc: "Reduce repetitive tasks with workflow steps." }
                    ].map((x) => (
                        <div key={x.title} className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
                            <div className="text-xl font-bold">{x.title}</div>
                            <div className="mt-2 text-slate-500">{x.desc}</div>
                        </div>
                    ))}
                </section>
            </div>
        </main>
    );
}

