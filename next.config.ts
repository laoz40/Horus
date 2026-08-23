import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	allowedDevOrigins: ["*.trycloudflare.com", "**.ts.net"],
	reactCompiler: true,
	typescript: {
		ignoreBuildErrors: true,
	},
};

export default nextConfig;
