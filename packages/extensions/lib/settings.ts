import {
	DEFAULT_READER_SETTINGS,
	type ReaderSettings,
} from '@read-for-speed/speed-reader/rsvp-reader'

export const readerSettings = storage.defineItem<ReaderSettings>(
	'local:read-for-speed:settings',
	{ fallback: DEFAULT_READER_SETTINGS },
)
