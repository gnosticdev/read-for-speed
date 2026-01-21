import { useIsomorphicLayoutEffect } from 'usehooks-ts'

export function useOnMount(callback: () => void) {
	const isMounted = useRef(false)

	useIsomorphicLayoutEffect(() => {
		if (isMounted.current) return
		callback()
		isMounted.current = true
	}, [])
}
