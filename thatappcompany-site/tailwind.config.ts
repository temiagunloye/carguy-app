import type { Config } from "tailwindcss";

export default {
    content: ["./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            borderRadius: {
                "xl2": "1.25rem"
            }
        }
    },
    plugins: []
} satisfies Config;
