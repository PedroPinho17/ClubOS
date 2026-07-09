import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

/**
 * Standalone gera symlinks em `.next/standalone` (necessario para Docker).
 * No Windows local isso falha com EPERM sem Developer Mode — desactivamos por omissao.
 * CI/Docker (Linux) e builds com NEXT_STANDALONE=true mantem standalone.
 */
const useStandalone =
  process.env.NEXT_STANDALONE === 'true' ||
  (process.env.NEXT_STANDALONE !== 'false' && process.platform !== 'win32');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(useStandalone ? { output: 'standalone' as const } : {}),
};

const sentryEnabled = Boolean(process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim());

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      silent: true,
      disableLogger: true,
      widenClientFileUpload: false,
    })
  : nextConfig;
