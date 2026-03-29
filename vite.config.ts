import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    {
      name: 'spa-fallback',
      apply: 'serve',
      configureServer(server) {
        return () => {
          server.middlewares.use((req, res, next) => {
            // Allow these to pass through
            if (
              req.url === '/' ||
              /\.(js|css|map|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/.test(req.url) ||
              req.url.includes('/@') ||
              req.url.includes('node_modules') ||
              req.url.includes('/api/')
            ) {
              next();
            } else {
              // Fallback to index.html for SPA routing
              req.url = '/index.html';
              next();
            }
          });
        };
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
