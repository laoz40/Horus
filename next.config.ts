import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactCompiler: true,
	typescript: {
		ignoreBuildErrors: true,
	},
	turbopack: {
		root: ".",
	},
};

export default nextConfig;
