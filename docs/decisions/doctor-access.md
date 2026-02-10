# Decision Log: Doctor Access Module (Stage 01)

## Role Detection
The user role is detected during the authentication process and persisted in the `profiles` table in Supabase.
- In **Supabase Mode**, the role is fetched from the `profiles` table matching the authenticated `user.id`.
- In **Stub Mode**, the role is simulated via a `mock_role` cookie.
- The `getCurrentUser()` helper in `lib/session.ts` provides a unified interface for accessing the session and role.

## Authorization Guard (RBAC)
We implemented a two-layer security model:
1. **Middleware (Gatekeeper)**: `middleware.ts` intercepts all requests to `/admin`, `/doctor`, and `/secretary`. It uses the `isPathAuthorized` helper from `lib/rbac-rules.ts` to decide if a request should be allowed based on the user's role. If unauthorized, the user is redirected to their respective role's home page (using `getAuthorizedHome`).
2. **Server Actions (Defense in Depth)**: Every server action in the system is protected by `requireRole(['DOCTOR', ...])`, providing a second layer of defense even if middleware is bypassed or incorrectly configured.

## Decision: Redirect vs 403
We chose **Redirect** as the default behavior for unauthorized navigation:
- **Consistency**: Users are automatically sent to the correct workspace for their role, reducing friction.
- **Privacy**: Redirecting away from `/admin` prevents "information leaks" about which admin routes exist.
- **Simplicity**: Avoids jarring error pages for users who might have clicked a stale bookmark or a legacy link.

## Initial Route (Home)
The `/doctor` route has been consolidated as the entry point for Doctors. This route serves as a dashboard showcasing key metrics (Next Patient, Queue Status), providing immediate operational value upon login.
