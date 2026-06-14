import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	allowedDevOrigins: ["*.trycloudflare.com"],
	experimental: {
		viewTransition: true,
	},
	reactCompiler: true,
	typescript: {
		ignoreBuildErrors: true,
	},
	turbopack: {
		root: ".",
	},
};

export default nextConfig;
