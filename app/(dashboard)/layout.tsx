import { logoutAction } from '@/app/actions/auth';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <aside style={{ width: '250px', backgroundColor: '#f5f5f5', padding: '1rem', borderRight: '1px solid #ddd' }}>
                <h2 style={{ marginBottom: '2rem' }}>SDMED SYS</h2>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.5rem' }}>Modules</h3>
                    <a href="/secretary/agenda" style={{ display: 'block', textDecoration: 'none', color: '#333', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '0.5rem' }}>Agenda</a>
                    <a href="/secretary/queue" style={{ display: 'block', textDecoration: 'none', color: '#333', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '0.5rem' }}>Queue Control</a>
                    <a href="/admin/patients" style={{ display: 'block', textDecoration: 'none', color: '#333', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '0.5rem' }}>Patient Management</a>
                    <a href="/tv" target="_blank" style={{ display: 'block', textDecoration: 'none', color: '#0070f3', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}>Open TV View</a>
                </nav>

                <form action={logoutAction} style={{ marginTop: 'auto' }}>
                    <button type="submit" style={{ width: '100%', padding: '0.5rem', backgroundColor: '#e00', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Logout
                    </button>
                </form>
            </aside>
            <main style={{ flex: 1, padding: '2rem' }}>
                {children}
            </main>
        </div>
    );
}
