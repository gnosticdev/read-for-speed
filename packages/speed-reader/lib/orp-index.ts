type MultiORP = {
	anchorWordIndex: number // which word in `words` is the pivot word
	orpCharIndex: number // pivot char index within the trimmed anchor word (Unicode codepoint index)
}

// biome-ignore format: long set
const STOP = new Set([
    "a","an","the","and","or","but","to","of","in","on","at","for","from","by","with","as","is","are","was","were","be","been","being",
    "it","its","that","this","these","those","i","you","he","she","we","they","them","me","him","her","us","my","your","his","our","their",
  ]);

function trimEdgePunct(s: string) {
	return s.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
}

function codepoints(s: string) {
	return [...s]
}

/**
 * Calculate Optimal Recognition Point (ORP) for a single word
 * This is roughly 35% into the word, with punctuation and numbers removed
 */

export function getSingleWordORPIndex(word: string): number {
	const trimmed = trimEdgePunct(word)
	const cps = codepoints(trimmed)
	const len = cps.length

	if (len <= 1) return 0
	if (len <= 3) return 1
	if (len <= 5) return 2
	if (len <= 7) return 2
	if (len <= 9) return 3
	if (len <= 13) return 4
	if (len <= 17) return 5

	const i = Math.round(len * 0.38)
	return Math.max(0, Math.min(i, len - 1))
}

/**
 * Multi-word ORP:
 * - Pick an anchor word in the chunk
 * - Compute ORP within that anchor using single-word ORP
 * - Keep the anchor's ORP fixed on screen; other words flow around it
 */
export function getMultiWordORPIndex(words: string[]): MultiORP {
	const n = words.length
	if (n <= 0) return { anchorWordIndex: 0, orpCharIndex: 0 }
	if (n === 1)
		return { anchorWordIndex: 0, orpCharIndex: getSingleWordORPIndex(words[0]) }

	const trimmed = words.map(trimEdgePunct)
	const lower = trimmed.map((w) => w.toLowerCase())
	const lens = trimmed.map((w) => codepoints(w).length)

	// Candidate scoring: prefer content words, longer words, later words.
	// Avoid anchoring on stopwords or 1–2 letter tokens when possible.
	let bestIdx = n - 1
	let bestScore = -Infinity

	for (let i = 0; i < n; i++) {
		const w = trimmed[i]
		const len = lens[i]

		if (len === 0) continue

		const isStop = STOP.has(lower[i])
		const hasLetter = /\p{L}/u.test(w)

		let score = 0

		// Prefer real words with letters
		score += hasLetter ? 10 : 0

		// Prefer longer words
		score += Math.min(len, 14) // cap influence

		// Prefer later words (reduces perceived "lag" in comprehension)
		score += i * 2

		// Penalize stopwords and tiny tokens
		if (isStop) score -= 8
		if (len <= 2) score -= 6

		// Prefer last word if roughly tied
		if (i === n - 1) score += 2

		if (score > bestScore) {
			bestScore = score
			bestIdx = i
		}
	}

	const orp = getSingleWordORPIndex(words[bestIdx])
	return { anchorWordIndex: bestIdx, orpCharIndex: orp }
}
