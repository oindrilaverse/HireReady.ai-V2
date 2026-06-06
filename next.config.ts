import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  // Fix: Next.js detected multiple package-lock.json files and inferred the wrong
  // workspace root. Pin it explicitly to this project directory.
  outputFileTracingRoot: path.join(__dirname, "./"),
};

export default nextConfig;

