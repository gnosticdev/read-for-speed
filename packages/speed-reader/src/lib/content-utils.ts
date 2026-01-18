import type { FontSizePreset } from '../components/rsvp-reader'

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
 * Multipliers for each font size preset.
 * These scale the base calculated font size.
 */
const FONT_SIZE_MULTIPLIERS: Record<FontSizePreset, number> = {
	sm: 0.7,
	md: 1.0,
	lg: 1.4,
}

/**
 * Minimum and maximum font sizes in pixels to keep text readable.
 */
const MIN_FONT_SIZE = 16
const MAX_FONT_SIZE = 120

/**
 * Default maximum word length to consider when calculating font size.
 * Based on common long words in English (e.g., "Internationalization" = 20 chars).
 * This is used as a fallback when no actual chunk length is provided.
 */
const DEFAULT_MAX_CHUNK_LENGTH = 20

/**
 * Character width ratio - approximate average character width relative to font size.
 * For monospace fonts this is typically 0.6, for proportional fonts around 0.5.
 * Using 0.55 as a safe middle ground.
 */
const CHAR_WIDTH_RATIO = 0.55

/**
 * Calculates the optimal font size for RSVP display based on container width
 * and the selected size preset. Ensures text fits on a single line.
 *
 * @param containerWidth - The width of the display container in pixels
 * @param preset - The font size preset (sm, md, lg)
 * @param fontFamily - The font family being used (affects character width estimation)
 * @returns The calculated font size in pixels
 *
 * @example
 * ```ts
 * const fontSize = calculateFontSize(800, 'md', 'sans') // ~72px
 * const fontSizeLg = calculateFontSize(800, 'lg', 'sans') // ~100px
 * ```
 */
export function calculateFontSize({
	containerWidth,
	preset,
	fontFamily = 'sans',
	largestChunkLength,
}: {
	containerWidth: number
	preset: FontSizePreset
	fontFamily?: 'sans' | 'mono' | 'serif'
	/**
	 * The length of the largest chunk in characters.
	 * If not provided, uses a default value suitable for typical English words.
	 */
	largestChunkLength?: number
}): number {
	if (containerWidth <= 0) {
		return MIN_FONT_SIZE
	}

	// Use the actual largest chunk length if provided, otherwise use default
	// Ensure a minimum length to avoid division issues or overly large fonts
	const maxLength = Math.max(largestChunkLength ?? DEFAULT_MAX_CHUNK_LENGTH, 5)

	// Adjust character width ratio based on font family
	let charWidthRatio = CHAR_WIDTH_RATIO
	if (fontFamily === 'mono') {
		charWidthRatio = 0.6 // Monospace fonts are wider
	} else if (fontFamily === 'serif') {
		charWidthRatio = 0.52 // Serif fonts are slightly narrower on average
	}

	// Calculate base font size that would fit the largest chunk
	// Formula: containerWidth = maxLength * charWidthRatio * fontSize
	// Therefore: fontSize = containerWidth / (maxLength * charWidthRatio)
	const baseFontSize = containerWidth / (maxLength * charWidthRatio)

	// Apply the preset multiplier
	const multiplier = FONT_SIZE_MULTIPLIERS[preset]
	const scaledFontSize = baseFontSize * multiplier

	// Clamp to min/max bounds
	return Math.round(
		Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, scaledFontSize)),
	)
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

/**
 * Find the length of the largest chunk in the array.
 * Used to calculate the optimal font size that will fit all chunks on a single line.
 *
 * @param chunks - Array of text chunks
 * @returns The length of the longest chunk in characters
 *
 * @example
 * ```ts
 * const chunks = ['hello', 'world', 'internationalization']
 * findLargestChunkLength(chunks) // 20
 * ```
 */
export function findLargestChunkLength(chunks: string[]): number {
	if (chunks.length === 0) return 0
	return Math.max(...chunks.map((chunk) => chunk.length))
}
