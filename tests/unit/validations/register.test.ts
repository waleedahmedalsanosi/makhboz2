/**
 * TC-S02-UNIT-001 through TC-S02-UNIT-003
 * registerSchema — area conditionality and role restrictions
 */
import { describe, it, expect } from 'vitest'
import { registerSchema } from '@/lib/validations'

describe('registerSchema', () => {
  const base = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123',
    phone: '0912345678',
  }

  describe('TC-S02-UNIT-001: BUYER without area @p1', () => {
    it('passes when area is omitted', () => {
      const result = registerSchema.safeParse({ ...base, role: 'BUYER' })
      expect(result.success).toBe(true)
    })

    it('passes when area is an empty string (treated as undefined)', () => {
      const result = registerSchema.safeParse({ ...base, role: 'BUYER', area: undefined })
      expect(result.success).toBe(true)
    })
  })

  describe('TC-S02-UNIT-002: BAKER without area @p1', () => {
    it('fails when area is omitted', () => {
      const result = registerSchema.safeParse({ ...base, role: 'BAKER' })
      expect(result.success).toBe(false)
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join('.'))
        expect(paths).toContain('area')
      }
    })

    it('passes when area is provided', () => {
      const result = registerSchema.safeParse({ ...base, role: 'BAKER', area: 'الخرطوم' })
      expect(result.success).toBe(true)
    })
  })

  describe('TC-S02-UNIT-003: ADMIN role rejected @p0', () => {
    it('fails when role is ADMIN', () => {
      const result = registerSchema.safeParse({ ...base, role: 'ADMIN', area: 'الخرطوم' })
      expect(result.success).toBe(false)
    })
  })

  describe('Email validation', () => {
    it('rejects invalid email', () => {
      const result = registerSchema.safeParse({ ...base, role: 'BUYER', email: 'not-an-email' })
      expect(result.success).toBe(false)
    })
  })

  describe('Password validation', () => {
    it('rejects password shorter than 6 characters', () => {
      const result = registerSchema.safeParse({ ...base, role: 'BUYER', password: '12345' })
      expect(result.success).toBe(false)
    })
  })
})
