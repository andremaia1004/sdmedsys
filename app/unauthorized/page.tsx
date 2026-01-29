import Link from 'next/link';

export default function UnauthorizedPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
            <h1 style={{ color: 'red' }}>Access Denied</h1>
            <p>You do not have permission to view this page.</p>
            <Link href="/login" style={{ marginTop: '1rem', color: '#0070f3' }}>
                Return to Login
            </Link>
        </div>
    );
}
