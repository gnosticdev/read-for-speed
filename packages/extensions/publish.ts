import { spawnSync } from 'node:child_process'
import { createInterface } from 'node:readline'

const rl = createInterface({
	input: process.stdin,
	output: process.stdout,
})

rl.question('Enter the path to the Chrome zip file: ', (zip) => {
	if (!zip) process.exit(1)
	const res = spawnSync('wxt', ['submit', '--chrome-zip', zip], {
		stdio: 'inherit',
	})
	process.exit(res.status ?? 1)
})
