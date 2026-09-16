import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/local-supabase/**/*.test.ts'],
    sequence: {
      concurrent: false,
    },
  },
})
