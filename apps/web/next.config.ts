import path from "path";
import type { NextConfig } from "next";

const apiOrigin = (process.env.API_URL ?? "http://localhost:8080").trim().replace(/\/+$/, "");

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "..", ".."),
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
  transpilePackages: [
    "@longox/shared-types",
    "@longox/api-client-react",
    "@longox/shared-realtime",
    "@longox/shared-events",
    "@longox/workflow-canvas",
  ],
  experimental: {
    optimizePackageImports: ["@radix-ui/react-icons"],
  },
  allowedDevOrigins: ["*"],
};

export default nextConfig;
