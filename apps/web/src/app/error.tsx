"use client";
import * as Sentry from "@sentry/nextjs";

export default function Error({ error }: { error: Error & { digest?: string } }) {
  Sentry.captureException(error);
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-sm opacity-70">We&apos;ve logged this and will fix it.</p>
    </div>
  );
}
