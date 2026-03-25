/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    outputFileTracingIncludes: {
      "/**/*": ["./node_modules/.prisma/client/**/*"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.blob.core.windows.net",
      },
    ],
  },
};

module.exports = nextConfig;
