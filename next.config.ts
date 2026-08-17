import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "pdf-parse",
    "@libsql/client",
    "libsql",
    "@prisma/adapter-libsql",
    "@prisma/driver-adapter-utils",
  ],
};

export default nextConfig;
