import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function crc32(buf: Buffer): number {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i += 1) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1)
      crc = (crc >>> 1) ^ (0xedb88320 & mask)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(size: number, rgba: Buffer): Buffer {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1)
    raw[rowStart] = 0
    rgba.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function paintIcon(size: number, maskable = false): Buffer {
  const rgba = Buffer.alloc(size * size * 4)
  const pad = maskable ? size * 0.12 : 0
  const set = (x: number, y: number, r: number, g: number, b: number) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    rgba[i] = r
    rgba[i + 1] = g
    rgba[i + 2] = b
    rgba[i + 3] = 255
  }

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      set(x, y, 9, 14, 24)
    }
  }

  const left = Math.floor(size * 0.28 + pad * 0.2)
  const laneW = Math.max(3, Math.floor(size * 0.08))
  const top = Math.floor(size * 0.2 + pad)
  const bottom = Math.floor(size * 0.8 - pad)
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x < left + laneW; x += 1) {
      const t = (y - top) / Math.max(1, bottom - top)
      const r = Math.round(255 * (1 - t) + 61 * t)
      const g = Math.round(159 * (1 - t) + 255 * t)
      const b = Math.round(67 * (1 - t) + 208 * t)
      set(x, y, r, g, b)
    }
  }

  // simplified M bars
  const mx = left + laneW + Math.floor(size * 0.08)
  const my = Math.floor(size * 0.32 + pad * 0.3)
  const mh = Math.floor(size * 0.36)
  const mw = Math.max(2, Math.floor(size * 0.055))
  const span = Math.floor(size * 0.26)
  for (let y = my; y < my + mh; y += 1) {
    for (let x = mx; x < mx + mw; x += 1) set(x, y, 238, 242, 247)
    for (let x = mx + span; x < mx + span + mw; x += 1) set(x, y, 238, 242, 247)
  }
  for (let i = 0; i < span; i += 1) {
    const y = my + Math.floor((i / span) * (mh * 0.45))
    for (let t = 0; t < mw; t += 1) {
      set(mx + i + t, y, 238, 242, 247)
      set(mx + span - i + t, y, 238, 242, 247)
    }
  }

  const cx = Math.floor(size * 0.74)
  const cy = Math.floor(size * 0.28)
  const radius = Math.floor(size * 0.055)
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2) set(x, y, 255, 159, 67)
    }
  }

  return encodePng(size, rgba)
}

function write(rel: string, buf: Buffer) {
  const path = join(root, rel)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, buf)
}

write('public/favicon-16.png', paintIcon(16))
write('public/favicon-32.png', paintIcon(32))
write('public/icons/icon-192.png', paintIcon(192))
write('public/icons/icon-512.png', paintIcon(512))
write('public/icons/maskable-512.png', paintIcon(512, true))
write('public/icons/apple-touch-icon.png', paintIcon(180))
console.log('MYLINE icons written')
