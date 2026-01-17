/**
 * Calculate estimated reading time
 */
export function estimateReadingTime(wordCount: number, wpm: number): string {
	const minutes = wordCount / wpm
	if (minutes < 1) {
		return `${Math.round(minutes * 60)} seconds`
	}
	return `${Math.round(minutes)} minute${minutes >= 2 ? 's' : ''}`
}

/**
 * Split text into optimal chunks for display
 */
export function chunkText(text: string, chunkSize: number): string[] {
	const words = text.split(/\s+/).filter((w) => w.length > 0)
	const chunks: string[] = []

	for (let i = 0; i < words.length; i += chunkSize) {
		chunks.push(words.slice(i, i + chunkSize).join(' '))
	}

	return chunks
}
