import path from "path"

// GitHub Pages: STATIC_EXPORT=1 builds a static site under NEXT_PUBLIC_BASE_PATH.
const staticExport = process.env.STATIC_EXPORT === "1"

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
  ...(staticExport
    ? {
        output: "export",
        trailingSlash: true,
        basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
        images: { unoptimized: true },
      }
    : {}),
}

export default nextConfig
