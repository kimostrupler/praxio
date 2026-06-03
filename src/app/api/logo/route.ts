import fs from 'fs'
import { LOGO_FILE } from '@/lib/data-paths'

export function GET() {
  try {
    const data = fs.readFileSync(LOGO_FILE, 'utf-8').trim()
    if (!data) return new Response(null, { status: 404 })

    const commaIdx = data.indexOf(',')
    if (commaIdx === -1) return new Response(null, { status: 404 })

    const mime   = data.slice(0, commaIdx).match(/data:([^;]+)/)?.[1] ?? 'image/png'
    const buffer = Buffer.from(data.slice(commaIdx + 1), 'base64')

    return new Response(buffer, {
      headers: { 'Content-Type': mime, 'Cache-Control': 'no-store' },
    })
  } catch {
    return new Response(null, { status: 404 })
  }
}
