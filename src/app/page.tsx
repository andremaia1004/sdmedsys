import Link from 'next/link';

export default function Home() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'sans-serif',
      backgroundColor: '#f5f5f5'
    }}>
      <h1 style={{ marginBottom: '1rem', color: '#333' }}>SDMED SYS - MVP</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>System is live and running.</p>

      <Link href="/login" style={{
        padding: '1rem 2rem',
        backgroundColor: '#0070f3',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '4px',
        fontWeight: 'bold'
      }}>
        Go to Login
      </Link>
    </div>
  );
}
