import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const mediapipeBundle = path.join(
  projectRoot,
  "node_modules/@mediapipe/tasks-vision/vision_bundle.mjs",
);

const nextConfig = {
  // When multiple package-lock.json files exist above this folder, Next may pick the wrong
  // workspace root and fail to resolve node_modules (e.g. @mediapipe/tasks-vision).
  turbopack: {
    root: projectRoot,
  },
  // MediaPipe ships ESM/CJS bundles; transpiling avoids "Cannot find module" / broken client chunks.
  transpilePackages: ["@mediapipe/tasks-vision"],
  // Webpack (next dev --webpack) sometimes fails package "exports" resolution for this package.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve ??= {};
      const prev = config.resolve.alias;
      config.resolve.alias = {
        ...(typeof prev === "object" && prev != null && !Array.isArray(prev) ? prev : {}),
        "@mediapipe/tasks-vision": mediapipeBundle,
      };
      config.resolve.modules = [
        path.join(projectRoot, "node_modules"),
        "node_modules",
      ];
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
    ],
  },
} satisfies NextConfig;

export default nextConfig;
