import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      {
        test: {
          name: 'root',
          include: ['test/**/*.test.ts'],
          exclude: ['**/node_modules/**', '**/dist/**', 'sources/**'],
        },
      },
      'packages/*',
    ],
    server: {
      deps: {
        inline: ['vitest-package-exports'],
      },
    },
  },
})
