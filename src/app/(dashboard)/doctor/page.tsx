export default function DoctorDashboard() {
    return (
        <div>
            <h1>Doctor Dashboard</h1>
            <p>Welcome, Dr. [Name].</p>
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#eef', borderRadius: '4px' }}>
                <h3>Today's Queue</h3>
                <p>You have 0 patients waiting.</p>
            </div>
        </div>
    );
}
