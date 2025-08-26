import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENV,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0),
  profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE || 0),
});
