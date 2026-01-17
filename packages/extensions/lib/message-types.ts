type CustomMessage<T extends string, P> = {
	type: T
	payload?: P
}

type GetSelectedTextMessage = CustomMessage<'RSVP_GET_SELECTION_TEXT', string>
type MountUIMessage = CustomMessage<'RSVP_MOUNT_UI', undefined>
type GetPageTextMessage = CustomMessage<'RSVP_GET_PAGE_TEXT', undefined>

export type CustomMessages =
	| GetSelectedTextMessage
	| MountUIMessage
	| GetPageTextMessage
