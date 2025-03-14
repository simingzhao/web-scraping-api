import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ["puppeteer-core", "chrome-aws-lambda"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude specific packages from the server build
      config.externals = [...(config.externals || []), "chrome-aws-lambda"];
    }
    return config;
  },
  // Increase the serverless function timeout for scraping operations
  serverRuntimeConfig: {
    timeoutSeconds: 60,
  },
};

export default nextConfig;
