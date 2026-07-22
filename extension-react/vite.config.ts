import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from '@samrum/vite-plugin-web-extension';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: {
        manifest_version: 3,
        name: "Tab Out Session",
        version: "1.0.0",
        description: "A new-tab session manager. Park tabs, restore sessions, stay focused.",
        chrome_url_overrides: { newtab: "newtab.html" },
        action: { default_popup: "popup.html", default_title: "Tab Out Session" },
        permissions: ["tabs", "storage", "windows", "favicon"],
        host_permissions: ["<all_urls>"],
        background: { service_worker: "background.js" },
        icons: { "16": "icons/icon16.png", "32": "icons/icon32.png", "48": "icons/icon48.png", "128": "icons/icon128.png" },
        web_accessible_resources: [
          {
            resources: ["icons/*", "assets/*"],
            matches: ["<all_urls>"]
          }
        ]
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
