import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:9090/api/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://localhost:9090/uploads/:path*",
      },
      {
        source: "/ws/:path*",
        destination: "http://localhost:9090/ws/:path*",
      },
    ];
  },
};

export default nextConfig;
