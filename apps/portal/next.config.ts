import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@ahi/shared', '@ahi/sdk', '@ahi/ui'],
  typedRoutes: true,
};

export default nextConfig;
