/**
 * TC-S01-P0-001 through TC-S01-P0-003, TC-S02-P1-018
 * Upload endpoint — MIME type, file size, and role enforcement
 */
import * as fs from 'fs'
import * as path from 'path'
import { test, expect, createBaker, prisma } from '../../support/fixtures'
import { authHeaders } from '../../support/auth/sign-in'

// Minimal valid JPEG (1×1 white pixel)
const TINY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8AKwAB/9k=',
  'base64'
)

// Minimal SVG with embedded script (should be rejected)
const SVG_PAYLOAD = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
)

function makeFormData(fileBuffer: Buffer, mimeType: string, filename: string, purpose = 'product') {
  const blob = new Blob([fileBuffer], { type: mimeType })
  const form = new FormData()
  form.append('file', new File([blob], filename, { type: mimeType }))
  form.append('purpose', purpose)
  return form
}

test.describe('POST /api/upload', () => {
  test.describe('MIME type validation @p0', () => {
    test('TC-S01-P0-001: SVG upload rejected with 400', async ({ request }) => {
      const { cookie } = await authHeaders(request, 'BAKER')
      const form = makeFormData(SVG_PAYLOAD, 'image/svg+xml', 'payload.svg', 'product')

      const res = await request.post('/api/upload', {
        headers: { cookie },
        multipart: {
          file: { name: 'payload.svg', mimeType: 'image/svg+xml', buffer: SVG_PAYLOAD },
          purpose: 'product',
        },
      })

      expect(res.status()).toBe(400)
      const body = await res.json()
      expect(body.error).toBeTruthy()
    })

    test('TC-S01-P0-001b: PDF upload rejected with 400', async ({ request }) => {
      const { cookie } = await authHeaders(request, 'BAKER')
      const pdfBuffer = Buffer.from('%PDF-1.4 fake pdf content')

      const res = await request.post('/api/upload', {
        headers: { cookie },
        multipart: {
          file: { name: 'doc.pdf', mimeType: 'application/pdf', buffer: pdfBuffer },
          purpose: 'product',
        },
      })

      expect(res.status()).toBe(400)
    })

    test('TC-S02-P1-018: JPEG accepted for baker product upload', async ({ request }) => {
      const { cookie } = await authHeaders(request, 'BAKER')

      const res = await request.post('/api/upload', {
        headers: { cookie },
        multipart: {
          file: { name: 'photo.jpg', mimeType: 'image/jpeg', buffer: TINY_JPEG },
          purpose: 'product',
        },
      })

      // 200 means Cloudinary accepted it — skip if Cloudinary not configured in test env
      if (res.status() === 500) {
        test.skip(true, 'Cloudinary not configured in test environment')
      }
      expect(res.status()).toBe(200)
      const body = await res.json()
      expect(body.url).toMatch(/^https:\/\/res\.cloudinary\.com\//)
    })
  })

  test.describe('File size validation @p0', () => {
    test('TC-S01-P0-002: file >5MB rejected with 400', async ({ request }) => {
      const { cookie } = await authHeaders(request, 'BAKER')
      // 6MB buffer of zeros
      const bigBuffer = Buffer.alloc(6 * 1024 * 1024, 0xff)

      const res = await request.post('/api/upload', {
        headers: { cookie },
        multipart: {
          file: { name: 'big.jpg', mimeType: 'image/jpeg', buffer: bigBuffer },
          purpose: 'product',
        },
      })

      expect(res.status()).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('ميغابايت')
    })
  })

  test.describe('Role enforcement @p0', () => {
    test('TC-S01-P0-003: buyer cannot upload to product folder → 403', async ({ request }) => {
      const { cookie } = await authHeaders(request, 'BUYER')

      const res = await request.post('/api/upload', {
        headers: { cookie },
        multipart: {
          file: { name: 'photo.jpg', mimeType: 'image/jpeg', buffer: TINY_JPEG },
          purpose: 'product',
        },
      })

      expect(res.status()).toBe(403)
    })

    test('Unauthenticated upload → 401', async ({ request }) => {
      const res = await request.post('/api/upload', {
        multipart: {
          file: { name: 'photo.jpg', mimeType: 'image/jpeg', buffer: TINY_JPEG },
          purpose: 'product',
        },
      })

      expect(res.status()).toBe(401)
    })
  })
})
