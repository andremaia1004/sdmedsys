export const dynamic = 'force-dynamic';

import PatientList from '@/features/patients/components/PatientList';
import PatientForm from '@/features/patients/components/PatientForm';
import { PatientService } from '@/features/patients/service';

export default async function AdminPatientsPage() {
    let patients = [];
    try {
        patients = await PatientService.list();
    } catch (e) {
        console.error('AdminPatientsPage: Failed to fetch patients', e);
    }

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Pacientes (Administrador)</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Lista de Pacientes</h2>
                    <PatientList patients={patients} canEdit={true} />
                </div>

                <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', height: 'fit-content' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Novo Paciente</h2>
                    <PatientForm />
                </div>
            </div>
        </div>
    );
}
