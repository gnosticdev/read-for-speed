import {
	DEFAULT_READING_STATS,
	type ReadingStats,
} from '@read-for-speed/speed-reader/stats-panel'

export const sessionStats = storage.defineItem<ReadingStats>(
	'session:read-for-speed:stats',
	{
		fallback: DEFAULT_READING_STATS,
	},
)
