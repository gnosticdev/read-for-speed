import type { ReadingStats } from '@read-for-speed/speed-reader/stats-panel'

export const sessionStats = storage.defineItem<ReadingStats>(
	'session:read-for-speed:stats',
	{
		fallback: {
			wordsRead: 0,
			totalWords: 0,
			sessionsCompleted: 0,
			averageWpm: 0,
			totalTimeSeconds: 0,
		},
	},
)
