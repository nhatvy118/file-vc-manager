import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    allowedHosts: [
      'marge-hiveless-nonstably.ngrok-free.dev',
      'localhost',
      '127.0.0.1'
    ],
    proxy: {
      '/api': {
        target: 'https://fmanager-dev.pila.vn',
        changeOrigin: true,
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            // Ensure browser can read Content-Disposition header (needed for filename)
            const current = proxyRes.headers['access-control-expose-headers'];
            const exposeList = current ? `${current}, Content-Disposition` : 'Content-Disposition';
            proxyRes.headers['access-control-expose-headers'] = exposeList;
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/auth-api': {
        target: 'https://auth-dev.pila.vn',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/auth-api/, '/api'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('auth proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to Auth Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            const current = proxyRes.headers['access-control-expose-headers'];
            const exposeList = current ? `${current}, Content-Disposition` : 'Content-Disposition';
            proxyRes.headers['access-control-expose-headers'] = exposeList;
            console.log('Received Response from Auth Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  }
})
