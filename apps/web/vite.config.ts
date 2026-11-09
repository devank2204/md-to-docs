import { FULL_MATERIAL_SYMBOLS_URL, MATERIAL_SYMBOLS_URL } from './materialSymbols.js';
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import fs from 'node:fs'
import { gzipSync } from 'node:zlib'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), {
    name: 'existing-symbol-font-subset',
    enforce: 'pre',
    transform(code, id) {
      if (id.endsWith('/src/index.css')) return code.replaceAll(FULL_MATERIAL_SYMBOLS_URL, MATERIAL_SYMBOLS_URL);
    },
    transformIndexHtml(html) { return html.replaceAll(FULL_MATERIAL_SYMBOLS_URL, MATERIAL_SYMBOLS_URL); },
  }, ...(process.env.PERF_ANALYZE ? [{
    name: 'performance-module-report',
    generateBundle(_options: unknown, bundle: any) {
      const chunks = Object.values(bundle).filter((item: any) => item.type === 'chunk').map((chunk: any) => ({
        file: chunk.fileName, entry: chunk.isEntry, imports: chunk.imports, dynamicImports: chunk.dynamicImports,
        bytes: Buffer.byteLength(chunk.code), gzip: gzipSync(chunk.code).length,
        modules: Object.entries(chunk.modules).map(([id, module]: any) => ({id, bytes: module.renderedLength})).sort((a,b) => b.bytes-a.bytes),
      }));
      fs.writeFileSync(process.env.PERF_ANALYZE!, JSON.stringify(chunks, null, 2));
    },
  }] : [])],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
