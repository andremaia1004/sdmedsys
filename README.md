# SDMED SYS (MVP)

A modular medical clinic management system built with Next.js 15 (App Router).

## Features
- **Role-Based Access**: Admin, Secretary, Doctor.
- **Modules**:
  - Patient Management (CRUD).
  - Agenda & Scheduling (Weekly View).
  - Online Queue & TV Output (Real-time-ish polling).
  - Consultation Workspace (Clinical Notes).

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally
```bash
npm run dev
```
Access the dashboard at `http://localhost:3000`.

### Roles (Mock)
To simulate roles, the system currently mocks the session in `src/lib/session.ts`.
- **Admin**: Access `/admin`
- **Secretary**: Access `/secretary`
- **Doctor**: Access `/doctor`
- **TV**: Access `/tv`

### Testing
Run unit tests with Vitest:
```bash
npm run test
```

## Deployment & Migration
### Environment Variables
Create a `.env.local` file (not needed for mock MVP, but for Supabase):
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Database Migration
The current services use in-memory Mock Repositories. To migrate:
1. Provision Supabase project.
2. Create tables matching Entities in `src/features/*/types.ts`.
3. Replace `src/features/*/service.ts` logic with Supabase Client calls.

## Architecture
- **Tech Stack**: Next.js 15, TypeScript, Vanilla CSS (Modules).
- **Structure**: Feature-based (`src/features/module`).
### TV Security
The `/tv` route is protected. In production, you must set the environment variable:
```env
TV_PIN=1234  # Replace with a secret PIN
```
To access the TV, append `?pin=YOUR_PIN` to the URL (e.g., `/tv?pin=1234`).
- Success: Redirects to `/tv` (clean URL) and sets a secure cookie (valid for 12h).
- Failure: Redirects to `/unauthorized`.
