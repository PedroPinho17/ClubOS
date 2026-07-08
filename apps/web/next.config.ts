import type { NextConfig } from 'next';

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

export default nextConfig;
