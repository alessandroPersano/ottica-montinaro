process.env.DATABASE_URL ??= "pglite:memory";
process.env.BETTER_AUTH_SECRET ??= "test-secret-at-least-32-characters-long";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000";
process.env.CRON_SECRET ??= "test-cron-secret-value";
process.env.EMAIL_OUTBOX ??= "true";
