const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds to focus on performance optimization
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    typedRoutes: true,
    // Optimize package imports for better tree shaking
    optimizePackageImports: [
      "@radix-ui/react-avatar",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-icons",
      "@radix-ui/react-label",
      "@radix-ui/react-navigation-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slider",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "lucide-react",
      "date-fns",
      "recharts",
    ],
  },
  images: {
    formats: ["image/webp", "image/avif"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ovgtdklsyykjnmkdrhqc.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: true,
      },
    ]
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Strategic bundle splitting for dashboard chunks
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Dashboard components chunk
          dashboard: {
            name: "dashboard",
            chunks: "all",
            test: /[\\/]components[\\/](dashboard|metrics|analytics)/,
            priority: 20,
            minChunks: 1,
          },
          // Charts and visualization chunk
          charts: {
            name: "charts",
            chunks: "all",
            test: /[\\/](recharts|[\\/]components[\\/]charts)/,
            priority: 25,
            minChunks: 1,
          },
          // UI components chunk
          ui: {
            name: "ui",
            chunks: "all",
            test: /[\\/]components[\\/]ui/,
            priority: 15,
            minChunks: 1,
          },
          // Radix UI chunk
          radix: {
            name: "radix",
            chunks: "all",
            test: /[\\/]node_modules[\\/]@radix-ui/,
            priority: 30,
            minChunks: 1,
          },
          // Auth and performance utilities
          libs: {
            name: "libs",
            chunks: "all",
            test: /[\\/]lib[\\/](auth|performance-data|services)/,
            priority: 10,
            minChunks: 1,
          },
        },
      }
    }

    return config
  },
}

module.exports = withBundleAnalyzer(nextConfig)
