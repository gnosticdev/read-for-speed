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
 * The maximum word length to consider when calculating font size.
 * Based on common long words in English (e.g., "Internationalization" = 20 chars).
 * This ensures the longest typical words will fit on a single line.
 */
const MAX_WORD_LENGTH = 20

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
export function calculateFontSize(
	containerWidth: number,
	preset: FontSizePreset,
	fontFamily: 'sans' | 'mono' | 'serif' = 'sans',
): number {
	if (containerWidth <= 0) {
		return MIN_FONT_SIZE
	}

	// Adjust character width ratio based on font family
	let charWidthRatio = CHAR_WIDTH_RATIO
	if (fontFamily === 'mono') {
		charWidthRatio = 0.6 // Monospace fonts are wider
	} else if (fontFamily === 'serif') {
		charWidthRatio = 0.52 // Serif fonts are slightly narrower on average
	}

	// Calculate base font size that would fit the max word length
	// Formula: containerWidth = maxWordLength * charWidthRatio * fontSize
	// Therefore: fontSize = containerWidth / (maxWordLength * charWidthRatio)
	const baseFontSize = containerWidth / (MAX_WORD_LENGTH * charWidthRatio)

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
