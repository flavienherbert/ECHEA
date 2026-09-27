import { defineConfig, devices } from '@playwright/test';

const executablePath = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium';

export default defineConfig({
  testDir: '.',
  timeout: 45000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:4173/',
    trace: 'off',
    launchOptions: { executablePath },
    acceptDownloads: true,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], launchOptions: { executablePath } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], launchOptions: { executablePath } } },
  ],
  webServer: process.env.BASE_URL ? undefined : {
    command: 'npx vite preview --config app/vite.config.js --port 4173 --strictPort --host 127.0.0.1',
    cwd: '../..',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: true,
    timeout: 60000,
  },
});
