import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	allowedDevOrigins: ["*.trycloudflare.com", "**.ts.net"],
	reactCompiler: true,
};

export default nextConfig;
