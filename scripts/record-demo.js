/**
 * Record a scripted demo video using headed Playwright.
 * Automates the full user flow while recording.
 *
 * Usage: node scripts/record-demo.js [url] [output]
 */

import { chromium } from 'playwright'
import { spawn } from 'child_process'
import { setTimeout as sleep } from 'timers/promises'
import { readdirSync } from 'fs'

const url = process.argv[2] ?? 'http://localhost:3000'
const output = process.argv[3] ?? `demo-${Date.now()}.mp4`

console.log(`Recording demo of ${url} → ${output}\n`)

const browser = await chromium.launch({
  headless: false,
  args: [
    '--start-maximized',
    '--disable-infobars',
    '--autoplay-policy=no-user-gesture-required',
  ],
})

const context = await browser.newContext({
  viewport: null,
  recordVideo: {
    dir: './tmp_demo_vid',
    size: { width: 1920, height: 1080 },
  },
})

const page = await context.newPage()

// --- SCRIPTED DEMO FLOW ---

// 1. Home page with hero
console.log('1. Home page')
await page.goto(url)
await sleep(3000)

// 2. Search for Yasuo
console.log('2. Search Yasuo')
await page.getByPlaceholder('Search champions...').fill('yasuo')
await sleep(1500)

// 3. Click Yasuo
console.log('3. Click Yasuo')
await page.locator('button:has-text("Yasuo")').first().click()
await sleep(2000)

// 4. Pick the long combo
console.log('4. Pick combo')
const combo = page.locator('button:has-text("qqeqaeqraq")')
if (await combo.isVisible()) {
  await combo.click()
} else {
  await page.locator('button:has-text("qeqwaeqfaeqraq")').click().catch(() => {})
}
await sleep(3000)

// 5. Unmute video
console.log('5. Unmute')
await page.locator('button:near(video)').last().click().catch(() => {})
await sleep(500)

// 6. Reset and play combo
console.log('6. Play combo')
await page.keyboard.press('Space')
await sleep(1500)

// Q Q E Q AA E Q R AA Q
await page.keyboard.press('q')
await sleep(2500)
await page.keyboard.press('q')
await sleep(2700)
await page.keyboard.press('e')
await sleep(400)
await page.keyboard.press('q')
await sleep(550)
await page.mouse.click(640, 300, { button: 'right' })
await sleep(100)
await page.keyboard.press('e')
await sleep(330)
await page.keyboard.press('q')
await sleep(70)
await page.keyboard.press('r')
await sleep(1260)
await page.mouse.click(640, 300, { button: 'right' })
await sleep(270)
await page.keyboard.press('q')
await sleep(3000)

// 7. Reset and show editing
console.log('7. Show combo editing')
await page.keyboard.press('Space')
await sleep(1500)

// Click a step to show the frame preview editor
const steps = await page.locator('.flex.flex-wrap.items-center.gap-1\\.5 button').all()
if (steps.length > 3) {
  await steps[3].click().catch(() => {})
  await sleep(3000)
  await steps[3].click().catch(() => {}) // close
}
await sleep(1000)

// 8. Navigate to next combo
console.log('8. Next combo')
const nextBtn = page.locator('button:has-text("Next")')
if (await nextBtn.isVisible()) {
  await nextBtn.click()
  await sleep(2500)
}

// 9. Open settings
console.log('9. Settings')
await page.getByLabel('Settings').click()
await sleep(3000)
await page.keyboard.press('Escape')
await sleep(1000)

// 10. Back to home
console.log('10. Home')
await page.goto(url)
await sleep(2500)

// --- END FLOW ---

console.log('\nClosing browser...')
await context.close()
await browser.close()

// Find the video file
const videoFiles = readdirSync('./tmp_demo_vid').filter(f => f.endsWith('.webm'))
const videoFile = `./tmp_demo_vid/${videoFiles[videoFiles.length - 1]}`
console.log(`Video: ${videoFile}`)

// Convert to MP4
console.log('Converting...')
const ffmpeg = spawn('ffmpeg', [
  '-i', videoFile,
  '-c:v', 'libx264',
  '-preset', 'fast',
  '-crf', '20',
  '-pix_fmt', 'yuv420p',
  '-y', output,
], { stdio: 'inherit' })

await new Promise(r => ffmpeg.on('close', r))
console.log(`\nDone! ${output}`)
