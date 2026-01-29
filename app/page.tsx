import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: 'var(--primary)',
      backgroundImage: 'linear-gradient(135deg, var(--primary) 0%, #001f41 100%)',
      color: 'white',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{
        width: '120px',
        height: '120px',
        backgroundColor: 'var(--accent)',
        borderRadius: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '3rem',
        fontWeight: 900,
        marginBottom: '2rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}>
        SD
      </div>
      <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.05em' }}>
        SDMED<span style={{ color: 'var(--accent)' }}>SYS</span>
      </h1>
      <p style={{ fontSize: '1.25rem', marginBottom: '3rem', opacity: 0.8, maxWidth: '500px' }}>
        A próxima geração em gestão médica. Eficiente, seguro e moderno.
      </p>

      <Link href="/login">
        <Button size="lg" variant="accent" style={{ padding: '1.5rem 3rem', fontSize: '1.25rem', borderRadius: '50px' }}>
          Acessar Sistema
        </Button>
      </Link>

      <div style={{ marginTop: 'auto', opacity: 0.5, fontSize: '0.875rem' }}>
        © 2026 SDMED SYS. Todos os direitos reservados.
      </div>
    </div>
  );
}
