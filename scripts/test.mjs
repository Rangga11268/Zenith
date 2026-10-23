import { spawn } from 'node:child_process'
import electronPath from 'electron'

console.log('[TEST RUNNER] Launching Electron in self-test mode...')

const child = spawn(electronPath, ['.'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    ZENITH_TEST: '1',
  },
})

const timeout = setTimeout(() => {
  console.error('[TEST RUNNER] TIMEOUT: Electron test did not finish within 15 seconds.')
  child.kill()
  process.exit(1)
}, 15000)

child.on('error', (err) => {
  clearTimeout(timeout)
  console.error('[TEST RUNNER] Failed to spawn Electron:', err)
  process.exit(1)
})

child.on('exit', (code) => {
  clearTimeout(timeout)
  console.log(`[TEST RUNNER] Electron process exited with code ${code}`)
  process.exit(code ?? 0)
})
