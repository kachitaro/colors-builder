import path from "path"

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Rewrite barrel imports to deep imports so a single icon doesn't pull the
    // whole package into the module graph.
    optimizePackageImports: [
      "@hugeicons/react",
      "@hugeicons/core-free-icons",
      "@phosphor-icons/react",
      "@remixicon/react",
    ],
  },
  outputFileTracingIncludes: {
    "/*": ["./registry/**/*", "./styles/**/*"],
  },
  transpilePackages: ["spectrum-colors"],
  turbopack: {
    root: path.resolve(import.meta.dirname, "../.."),
  },
  redirects() {
    return [{ source: "/", destination: "/create", permanent: false }]
  },
}

export default nextConfig
