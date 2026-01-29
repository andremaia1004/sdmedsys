import PatientList from '@/features/patients/components/PatientList';
import PatientForm from '@/features/patients/components/PatientForm';

export default function SecretaryPatientsPage() {
    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Patients (Secretary)</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Patient List</h2>
                    <PatientList role="SECRETARY" />
                </div>

                <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', height: 'fit-content' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>New Patient</h2>
                    <PatientForm />
                </div>
            </div>
        </div>
    );
}
