import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	agentRules: false,
	allowedDevOrigins: ["*.trycloudflare.com", "**.ts.net"],
	reactCompiler: true,
};

export default nextConfig;
