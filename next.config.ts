import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  serverExternalPackages: [
    "pdf-parse",
    "@libsql/client",
    "libsql",
    "@prisma/adapter-libsql",
    "@prisma/driver-adapter-utils",
  ],
};

export default nextConfig;
