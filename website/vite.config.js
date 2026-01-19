import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                pricing: resolve(__dirname, 'pricing.html'),
                about: resolve(__dirname, 'about.html'),
                support: resolve(__dirname, 'support.html'),
                privacy: resolve(__dirname, 'privacy.html'),
                terms: resolve(__dirname, 'terms.html'),
                dashboard: resolve(__dirname, 'dashboard.html'),
                crm: resolve(__dirname, 'crm.html'),
                // Body Shop pages
                bodyshop: resolve(__dirname, 'bodyshop/index.html'),
                bodyshopDealers: resolve(__dirname, 'bodyshop/app/dealers.html'),
                bodyshopParts: resolve(__dirname, 'bodyshop/app/dealer-parts.html'),
                bodyshopPortal: resolve(__dirname, 'bodyshop/portal/index.html'),
            },
        },
    },
})
