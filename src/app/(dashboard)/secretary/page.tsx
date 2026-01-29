export default function SecretaryDashboard() {
    return (
        <div>
            <h1>Secretary Dashboard</h1>
            <p>Welcome.</p>
            <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <h3>Patient Management</h3>
                    <p>Quick functionalities coming here.</p>
                </div>
                <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <h3>Upcoming Appointments</h3>
                    <p>Empty list.</p>
                </div>
            </div>
        </div>
    );
}
