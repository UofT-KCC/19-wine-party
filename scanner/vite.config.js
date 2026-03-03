import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'; //

export default defineConfig({
  plugins: [basicSsl(), react()], //
  server: {
    https: true, // Enable HTTPS
    host: true, // Enable host
  }
});
