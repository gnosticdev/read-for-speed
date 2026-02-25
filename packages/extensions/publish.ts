import { spawnSync } from 'node:child_process'
import { createInterface } from 'node:readline'

console.log(
	'Publishing chrome extension with chrome-webstore-upload-cli (wxt not working...',
)

process.loadEnvFile('.env.local')
const missingVars = [
	'EXTENSION_ID',
	'CLIENT_ID',
	'CLIENT_SECRET',
	'REFRESH_TOKEN',
].filter((key) => !process.env[key])

if (missingVars) {
	console.error(`Missing environment variables: ${missingVars.join(', ')}`)
	process.exit(1)
}

const rl = createInterface({
	input: process.stdin,
	output: process.stdout,
})

rl.question('Enter the path to the Chrome zip file: ', (zip) => {
	if (!zip) process.exit(1)
	// check env vars

	const res = spawnSync(
		'chrome-webstore-upload-cli',
		[
			'--extension-id',
			process.env.EXTENSION_ID!,
			'--client-id',
			process.env.CLIENT_ID!,
			'--client-secret',
			process.env.CLIENT_SECRET!,
			'--refresh-token',
			process.env.REFRESH_TOKEN!,
			'--source',
			zip,
		],
		{
			stdio: 'inherit',
		},
	)
	process.exit(res.status ?? 1)
})
