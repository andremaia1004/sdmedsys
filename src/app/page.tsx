import { redirect } from 'next/navigation';

export default function Home() {
  // Client-side fallback if middleware misses
  redirect('/login');

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Redirecting...</h1>
      <a href="/login">Click here if not redirected</a>
    </div>
  );
}
