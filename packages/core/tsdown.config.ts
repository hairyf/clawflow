import { defineConfig } from 'tsdown'

export default defineConfig({
  fixedExtension: true,
  entry: ['src/**/*.ts'],
  format: ['esm'],
  clean: true,
  dts: true,
})
