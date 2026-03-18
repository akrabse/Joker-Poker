/**
 * UITLEG VOOR DOCENT EN LEERLINGEN:
 * Vite is de zogenaamde 'bundler/bouwer' van ons frontend React project.
 * Dit bestand regelt de instellingen, inclusief een 'proxy' zodat de frontend 
 * veilig met onze backend (Express) op poort 5000 kan praten.
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
