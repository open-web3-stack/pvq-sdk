import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  ...(isGithubPages
    ? {
        basePath: '/pvq-sdk',
        assetPrefix: '/pvq-sdk/',
      }
    : {}),
};

export default nextConfig;
