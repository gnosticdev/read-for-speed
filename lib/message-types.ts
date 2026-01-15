type CustomMessage<T extends string, P> = {
	type: T
	payload?: P
}

type PageContentMessage = CustomMessage<'RSVP_GET_SELECTION_TEXT', string>
type MountUIMessage = CustomMessage<'RSVP_MOUNT_UI', undefined>

export type CustomMessages = PageContentMessage | MountUIMessage
