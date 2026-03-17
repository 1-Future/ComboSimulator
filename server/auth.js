import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sign, verify } from './jwt.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const USERS_FILE = join(__dirname, '..', 'users.json')

// Config
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? 'Ov23liWXZMIL7hJLSeB6'
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET ?? '56a8c1496d12540cee1777d5a7fc33663abdeaba'
const JWT_SECRET = process.env.JWT_SECRET ?? 'combosim-jwt-secret-change-in-production'
const ADMINS = ['1-Future']
function getBaseUrl(req) {
  const host = req.headers.host ?? 'localhost:3000'
  const proto = req.headers['x-forwarded-proto'] ?? (host.includes('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

async function getUsers() {
  try {
    const data = await readFile(USERS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return { users: {} }
  }
}

async function saveUsers(data) {
  await writeFile(USERS_FILE, JSON.stringify(data, null, 2))
}

function getRole(username) {
  return ADMINS.includes(username) ? 'admin' : 'user'
}

export async function handleAuth(req, res, url) {
  const pathname = url.pathname
  const baseUrl = getBaseUrl(req)

  // GET /auth/github — redirect to GitHub
  if (pathname === '/auth/github') {
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: `${baseUrl}/auth/callback`,
      scope: 'read:user',
    })
    res.writeHead(302, { Location: `https://github.com/login/oauth/authorize?${params}` })
    res.end()
    return true
  }

  // GET /auth/callback — GitHub redirects here with ?code=
  if (pathname === '/auth/callback') {
    const code = url.searchParams.get('code')
    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/plain' })
      res.end('Missing code')
      return true
    }

    try {
      // Exchange code for access token
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
        }),
      })
      const tokenData = await tokenRes.json()

      if (!tokenData.access_token) {
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('Failed to get access token')
        return true
      }

      // Fetch user profile
      const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'ComboSim' },
      })
      const githubUser = await userRes.json()

      // Upsert user
      const users = await getUsers()
      const role = getRole(githubUser.login)
      users.users[String(githubUser.id)] = {
        id: githubUser.id,
        username: githubUser.login,
        avatar: githubUser.avatar_url,
        role,
        createdAt: users.users[String(githubUser.id)]?.createdAt ?? new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      }
      await saveUsers(users)

      // Sign JWT
      const token = sign(
        { sub: githubUser.id, username: githubUser.login, avatar: githubUser.avatar_url, role },
        JWT_SECRET,
      )

      // Redirect to app with token
      res.writeHead(302, { Location: `${baseUrl}/?token=${token}` })
      res.end()
    } catch (err) {
      console.error('Auth error:', err)
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('Auth failed')
    }
    return true
  }

  // GET /auth/me — return current user from JWT
  if (pathname === '/auth/me') {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not authenticated' }))
      return true
    }

    const token = authHeader.slice(7)
    const payload = verify(token, JWT_SECRET)
    if (!payload) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid token' }))
      return true
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      id: payload.sub,
      username: payload.username,
      avatar: payload.avatar,
      role: payload.role,
    }))
    return true
  }

  // GET /auth/logout — just returns success (client clears token)
  if (pathname === '/auth/logout') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return true
  }

  return false
}
