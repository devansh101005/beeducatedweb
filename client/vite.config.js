// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })


import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Needed for path aliases

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Define path aliases (e.g., `@/` points to `./src`)
      '@': path.resolve(__dirname, './src'),
    },
  },
});