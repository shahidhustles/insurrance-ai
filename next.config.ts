import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark Node.js built-in modules as external
      // This prevents errors with packages like nodemailer
      config.externals = [
        ...(config.externals || []),
        "net",
        "tls",
        "fs",
        "crypto",
        "stream",
        "dns",
        "os",
        "path",
        "url",
      ];
    }

    return config;
  },
};

export default nextConfig;
