import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    maxWorkers: 4,
    typecheck: {
      enabled: true,
    },
  },
});
