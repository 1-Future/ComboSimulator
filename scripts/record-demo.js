/**
 * Record a demo video with system audio using headed Playwright + FFmpeg.
 *
 * Usage: node scripts/record-demo.js [url] [duration_seconds]
 * Example: node scripts/record-demo.js http://localhost:3000 60
 *
 * Requirements:
 * - FFmpeg installed (for screen + audio capture)
 * - Playwright installed (npm install)
 *
 * This launches a visible browser window and simultaneously records
 * the screen region + system audio using FFmpeg's gdigrab + dshow.
 */

import { chromium } from 'playwright'
import { spawn, execSync } from 'child_process'
import { setTimeout as sleep } from 'timers/promises'

const url = process.argv[2] ?? 'http://localhost:3000'
const duration = parseInt(process.argv[3] ?? '45', 10)
const output = `demo-${Date.now()}.mp4`

// Find FFmpeg
const ffmpegPath = execSync('where ffmpeg', { encoding: 'utf-8' }).trim().split('\n')[0].trim()
console.log(`FFmpeg: ${ffmpegPath}`)

// Get system audio device name
let audioDevice = null
try {
  const devices = execSync(`"${ffmpegPath}" -list_devices true -f dshow -i dummy 2>&1`, {
    encoding: 'utf-8',
    shell: true,
  }).toString()

  // Look for audio devices
  const lines = devices.split('\n')
  let inAudio = false
  for (const line of lines) {
    if (line.includes('DirectShow audio devices')) inAudio = true
    if (inAudio && line.includes('"') && !line.includes('DirectShow')) {
      const match = line.match(/"([^"]+)"/)
      if (match) {
        audioDevice = match[1]
        break
      }
    }
  }
} catch (e) {
  // Parse from stderr
  const stderr = e.stderr?.toString() ?? e.stdout?.toString() ?? ''
  const lines = stderr.split('\n')
  let inAudio = false
  for (const line of lines) {
    if (line.includes('DirectShow audio devices')) inAudio = true
    if (inAudio && line.includes('"') && !line.includes('DirectShow')) {
      const match = line.match(/"([^"]+)"/)
      if (match) {
        audioDevice = match[1]
        break
      }
    }
  }
}

console.log(`Audio device: ${audioDevice ?? 'none (video only)'}`)
console.log(`Recording ${duration}s to ${output}`)
console.log(`URL: ${url}`)
console.log('')

// Launch browser
const browser = await chromium.launch({
  headless: false,
  args: [
    '--window-size=1280,800',
    '--window-position=100,100',
    '--disable-infobars',
    '--autoplay-policy=no-user-gesture-required',
  ],
})

const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
})
const page = await context.newPage()

// Navigate
await page.goto(url)
await sleep(2000)

// Get the browser window title for FFmpeg to capture
const title = await page.title()
console.log(`Browser title: "${title}"`)

// Start FFmpeg recording — capture the whole screen
// Using gdigrab for screen + dshow for system audio
const ffmpegArgs = [
  '-y',
  // Screen capture
  '-f', 'gdigrab',
  '-framerate', '30',
  '-offset_x', '100',
  '-offset_y', '100',
  '-video_size', '1280x800',
  '-i', 'desktop',
]

// Add audio if available
if (audioDevice) {
  ffmpegArgs.push(
    '-f', 'dshow',
    '-i', `audio=${audioDevice}`,
  )
}

ffmpegArgs.push(
  // Output settings
  '-c:v', 'libx264',
  '-preset', 'ultrafast',
  '-crf', '23',
  '-pix_fmt', 'yuv420p',
)

if (audioDevice) {
  ffmpegArgs.push('-c:a', 'aac', '-b:a', '128k')
}

ffmpegArgs.push(
  '-t', String(duration),
  output,
)

console.log('Starting FFmpeg...')
const ffmpeg = spawn(ffmpegPath, ffmpegArgs, { stdio: 'pipe' })

ffmpeg.stderr.on('data', (data) => {
  const line = data.toString().trim()
  if (line.includes('frame=') || line.includes('time=')) {
    process.stdout.write(`\r${line.substring(0, 80)}`)
  }
})

console.log(`Recording for ${duration}s — interact with the browser window!`)
console.log('Press Ctrl+C to stop early.\n')

// Wait for recording to finish
await new Promise((resolve) => {
  ffmpeg.on('close', resolve)
})

console.log(`\n\nSaved: ${output}`)

await browser.close()
process.exit(0)
