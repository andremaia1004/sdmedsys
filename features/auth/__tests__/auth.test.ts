import { describe, it, expect } from 'vitest'

describe('Auth Feature', () => {
    it('should pass a basic sanity check', () => {
        expect(true).toBe(true)
    })

    it('should simulate a login function', () => {
        const login = (user: string) => {
            if (user === 'admin') return 'ADMIN_ROLE'
            return 'GUEST'
        }
        expect(login('admin')).toBe('ADMIN_ROLE')
        expect(login('guest')).toBe('GUEST')
    })
})
