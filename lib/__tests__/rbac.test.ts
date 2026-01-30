import { describe, it, expect } from 'vitest';
import { isPathAuthorized, getAuthorizedHome } from '../rbac-rules';
import { Role } from '../session';

describe('RBAC Logic', () => {
    describe('isPathAuthorized', () => {
        it('should allow ADMIN to access /admin', () => {
            expect(isPathAuthorized('/admin/dashboard', 'ADMIN')).toBe(true);
        });

        it('should deny DOCTOR to access /admin', () => {
            expect(isPathAuthorized('/admin/doctors', 'DOCTOR')).toBe(false);
        });

        it('should deny SECRETARY to access /admin', () => {
            expect(isPathAuthorized('/admin/settings', 'SECRETARY')).toBe(false);
        });

        it('should allow DOCTOR to access /doctor', () => {
            expect(isPathAuthorized('/doctor/agenda', 'DOCTOR')).toBe(true);
        });

        it('should allow ADMIN to access /doctor', () => {
            expect(isPathAuthorized('/doctor/queue', 'ADMIN')).toBe(true);
        });

        it('should deny SECRETARY to access /doctor', () => {
            expect(isPathAuthorized('/doctor/consultation', 'SECRETARY')).toBe(false);
        });

        it('should allow SECRETARY to access /secretary', () => {
            expect(isPathAuthorized('/secretary/agenda', 'SECRETARY')).toBe(true);
        });

        it('should allow ADMIN to access /secretary', () => {
            expect(isPathAuthorized('/secretary/queue', 'ADMIN')).toBe(true);
        });

        it('should allow public access to unlisted paths', () => {
            expect(isPathAuthorized('/login', 'SECRETARY')).toBe(true);
            expect(isPathAuthorized('/unauthorized', 'DOCTOR')).toBe(true);
        });
    });

    describe('getAuthorizedHome', () => {
        it('should return correct home for ADMIN', () => {
            expect(getAuthorizedHome('ADMIN')).toBe('/admin/patients');
        });

        it('should return correct home for DOCTOR', () => {
            expect(getAuthorizedHome('DOCTOR')).toBe('/doctor/agenda');
        });

        it('should return correct home for SECRETARY', () => {
            expect(getAuthorizedHome('SECRETARY')).toBe('/secretary/agenda');
        });
    });
});
