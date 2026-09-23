import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// El proxy de Vite se resuelve en Node (no en el navegador).
// En Docker (docker compose) se pasa VITE_API_PROXY_TARGET=http://api:8000;
// en desarrollo local apunta al puerto 8001 (el bot Cisternin usa el 8000).
declare const process: { env?: Record<string, string | undefined> };

const proxyTarget = process.env?.VITE_API_PROXY_TARGET ?? "http://localhost:8001";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Escucha en TODAS las interfaces (IPv4 0.0.0.0 + IPv6 ::1) → localhost, 127.0.0.1 y LAN funcionan
    host: true,
    port: 5173,
    // Hosts permitidos en dev → evitar 403 de Vite (localhost, IPv4 y el tunel Cloudflare)
    allowedHosts: ["localhost", "127.0.0.1", ".trycloudflare.com"],
    // Proxy hacia la API FastAPI en dev → evita CORS
    proxy: {
      "/api": {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
});