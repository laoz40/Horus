export function shortHash(input: string) {
	let hash = 2166136261; // FNV-1a offset basis

	for (let i = 0; i < input.length; i++) {
		hash ^= input.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}

	return (hash >>> 0).toString(36);
}
