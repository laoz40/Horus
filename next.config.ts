import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	allowedDevOrigins: ["*.trycloudflare.com"],
	reactCompiler: true,
	typescript: {
		ignoreBuildErrors: true,
	},
};

export default nextConfig;
