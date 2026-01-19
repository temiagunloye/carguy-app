export type UpdateItem = {
    id: string;
    appSlug: string;
    title: string;
    summary: string;
    dateISO: string;
    tags: string[];
};

export const UPDATES: UpdateItem[] = [
    {
        id: "gm-003",
        appSlug: "garage-manager",
        title: "Inventory Cloud Sync",
        summary: "Real-time sync across devices. Start on desktop, finish on mobile.",
        dateISO: "2026-02-12",
        tags: ["Cloud", "Sync"]
    },
    {
        id: "studio-001",
        appSlug: "studio",
        title: "The Studio Workflow",
        summary: "Defining our internal 'Observe -> Engineer' process for all future apps.",
        dateISO: "2026-02-10",
        tags: ["Culture", "Process"]
    },
    {
        id: "gm-002",
        appSlug: "garage-manager",
        title: "Visual Parts Picker",
        summary: "Drag-and-drop 3D parts onto your build canvas.",
        dateISO: "2026-01-28",
        tags: ["3D", "UX"]
    }
];
