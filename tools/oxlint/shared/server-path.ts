export function isServerImplementationFile(file: string): boolean {
	return /\/src\/(?:server|features\/[^/]+\/server)\//u.test(file.replaceAll("\\", "/"));
}
