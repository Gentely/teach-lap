/** @type {import('next').NextConfig} */
const nextConfig = {
  // حتى لا يحزم pdf-parse داخل client bundle — يعمل فقط على الخادم
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "mammoth"],
  },
  // منع تحذيرات canvas في pdf-parse على Vercel
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
