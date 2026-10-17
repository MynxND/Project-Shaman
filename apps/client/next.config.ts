import type { NextConfig } from 'next';
// Opt-in worker cap for visual-asset sessions with limited free RAM; normal builds keep Next's default.
const buildWorkers = Number(process.env.SHAMAN_BUILD_WORKERS);
const config: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  transpilePackages: ['@shaman/shared', '@shaman/schema'],
  ...(Number.isInteger(buildWorkers) && buildWorkers > 0 ? { experimental: { cpus: buildWorkers } } : {}),
};
export default config;
