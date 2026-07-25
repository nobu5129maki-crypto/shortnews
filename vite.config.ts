import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { newsApiPlugin } from './vite.newsApiPlugin.ts'

export default defineConfig({
  plugins: [react(), newsApiPlugin()],
})
