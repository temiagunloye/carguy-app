import { UPDATES } from "@/lib/updates";

export default function GarageManagerUpdates() {
    const list = UPDATES.filter((u) => u.appSlug === "garage-manager");

    return (
        <main className="min-h-screen bg-white px-5 py-10 text-slate-900">
            <div className="mx-auto max-w-4xl">
                <header className="flex items-center justify-between">
                    <a href="/" className="text-sm font-semibold">ThatAppCompany</a>
                    <a href="/apps/garage-manager" className="text-sm text-slate-600 hover:text-slate-900">Back to App</a>
                </header>

                <section className="mt-10">
                    <h1 className="text-3xl font-semibold tracking-tight">Garage Manager Updates</h1>
                    <p className="mt-2 text-slate-600">Changelog timeline (tags + search can be expanded next).</p>

                    <div className="mt-6 grid gap-3">
                        {list.map((u) => (
                            <div key={u.id} className="rounded-[28px] border border-slate-200 bg-white p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="font-semibold">{u.title}</div>
                                    <div className="text-xs text-slate-500">{u.dateISO}</div>
                                </div>
                                <div className="mt-1 text-sm text-slate-600">{u.summary}</div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {u.tags.map((t) => (
                                        <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{t}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
