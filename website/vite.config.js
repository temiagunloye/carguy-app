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
                visualizer: resolve(__dirname, 'visualizer-preview.html'),
                sharedBuild: resolve(__dirname, 'shared-build.html'),
                // Shop Portal
                shopLogin: resolve(__dirname, 'shop/login.html'),
                shopDashboard: resolve(__dirname, 'shop/dashboard.html'),
                shopSimulator: resolve(__dirname, 'shop/simulator.html'),
                // Body Shop pages
                bodyshop: resolve(__dirname, 'bodyshop/index.html'),
            },
        },
    },
})
