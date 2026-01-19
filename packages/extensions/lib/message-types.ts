type CustomMessage<T extends string, P> = {
	type: T
	payload?: P
}

type ShowReaderWithTextMessage = CustomMessage<
	'SHOW_READER_WITH_SELECTED_TEXT',
	string
>
type ShowReaderMessage = CustomMessage<'SHOW_READER', undefined>

type ParsePageContentMessage = CustomMessage<
	'PARSE_PAGE_CONTENT',
	{ docClone: Document }
>

export type RSVPReaderMessage =
	| ShowReaderWithTextMessage
	| ShowReaderMessage
	| ParsePageContentMessage
