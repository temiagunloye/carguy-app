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
                // Dashboard & CRM
                dashboard: resolve(__dirname, 'dashboard.html'),
                crm: resolve(__dirname, 'crm.html'),
                // New Pages (V1 Benchmark)
                viewer: resolve(__dirname, 'viewer.html'),
                visualizer: resolve(__dirname, 'visualizer-preview.html'),
                sharedBuild: resolve(__dirname, 'shared-build.html'),
                // Shop Portal -> Partner Portal
                partnerLogin: resolve(__dirname, 'partner/login.html'),
                partnerDashboard: resolve(__dirname, 'partner/dashboard.html'),
                partnerSimulator: resolve(__dirname, 'partner/simulator.html'),
                partnerMarketplace: resolve(__dirname, 'partner/marketplace.html'),
                partnerPartDetail: resolve(__dirname, 'partner/part-detail.html'),
                partnerInventoryAdd: resolve(__dirname, 'partner/inventory-add.html'),
                partnerBuilds: resolve(__dirname, 'partner/builds.html'),
                // Shop Portal (duplicate of partner for URL flexibility)
                shopSimulator: resolve(__dirname, 'shop/simulator.html'),
                // Body Shop pages
                bodyshop: resolve(__dirname, 'bodyshop/index.html'),
            },
        },
    },
})
