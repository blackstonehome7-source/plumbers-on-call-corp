import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.plumberoncallcorp.com" }],
        destination: "https://plumberoncallcorp.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
