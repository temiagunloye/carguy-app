export type AppStatus = "Live" | "Beta" | "In Dev";

export type AppItem = {
    slug: string;
    name: string;
    oneLiner: string;
    status: AppStatus;
    tags: string[];
    // Where "Go to App" sends the user. If empty, default to internal route.
    targetUrl?: string;
};

export const APPS: AppItem[] = [
    {
        slug: "garage-manager",
        name: "Garage Manager",
        oneLiner: "The operating system for your car build.",
        status: "Beta",
        tags: ["Inventory", "Planning", "Automated Workflows"],
        targetUrl: "" // Uses env var or default
    }
];
