import type { NextConfig } from "next";

const apiOrigin = process.env.API_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
  transpilePackages: [
    "@autoflow/shared-types",
    "@autoflow/api-client-react",
    "@autoflow/shared-realtime",
    "@autoflow/shared-events",
    "@autoflow/workflow-canvas",
  ],
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
};

export default nextConfig;
