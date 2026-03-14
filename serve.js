/**
 * Simple production server for ComboSimulator.
 * Serves the built app from dist/ and videos from videos/.
 * Run with: node serve.js
 * Then expose with: cloudflared tunnel --url http://localhost:3000
 */

import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const PORT = process.env.PORT ?? 3000

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2',
}

const STREAMABLE = new Set(['.mp4', '.webm', '.mp3'])

async function serveFile(req, res, filePath, cacheControl = 'public, max-age=3600') {
  try {
    const stats = await stat(filePath)
    if (!stats.isFile()) throw new Error('Not a file')

    const ext = extname(filePath)
    const mime = MIME_TYPES[ext] ?? 'application/octet-stream'
    const fileSize = stats.size

    res.setHeader('Content-Type', mime)
    res.setHeader('Cache-Control', cacheControl)
    res.setHeader('Access-Control-Allow-Origin', '*')

    // Range request support for video/audio seeking
    if (STREAMABLE.has(ext)) {
      res.setHeader('Accept-Ranges', 'bytes')

      const range = req.headers.range
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-')
        const start = parseInt(parts[0], 10)
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
        const chunkSize = end - start + 1

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Content-Length': chunkSize,
        })
        createReadStream(filePath, { start, end }).pipe(res)
        return true
      }
    }

    // Full file response (stream for large files)
    if (fileSize > 1024 * 1024) {
      res.writeHead(200, { 'Content-Length': fileSize })
      createReadStream(filePath).pipe(res)
    } else {
      const data = await readFile(filePath)
      res.writeHead(200, { 'Content-Length': fileSize })
      res.end(data)
    }
  } catch {
    return false
  }
  return true
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
  let pathname = decodeURIComponent(url.pathname)

  // Videos: /videos/Champion/file.mp4
  if (pathname.startsWith('/videos/')) {
    const videoPath = join(__dirname, pathname)
    if (await serveFile(req, res, videoPath, 'public, max-age=86400')) return
    res.writeHead(404)
    res.end('Video not found')
    return
  }

  // Static assets from dist/
  let filePath = join(__dirname, 'dist', pathname)

  // Try exact file first
  if (await serveFile(req, res, filePath, 'public, max-age=31536000, immutable')) return

  // SPA fallback: serve index.html for non-file routes
  filePath = join(__dirname, 'dist', 'index.html')
  if (await serveFile(req, res, filePath, 'no-cache')) return

  res.writeHead(404)
  res.end('Not found')
})

server.listen(PORT, () => {
  console.log(`ComboSimulator running at http://localhost:${PORT}`)
  console.log(`Videos served from ./videos/`)
  console.log(``)
  console.log(`To expose publicly:`)
  console.log(`  cloudflared tunnel --url http://localhost:${PORT}`)
})
