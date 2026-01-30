export const dynamic = 'force-dynamic';

import PatientList from '@/features/patients/components/PatientList';
import PatientForm from '@/features/patients/components/PatientForm';
import { PatientService } from '@/features/patients/service';
import { requireRole } from '@/lib/session';
import { Patient } from '@/features/patients/types';

export default async function SharedPatientsPageResource() {
    const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);
    let patients: Patient[] = [];
    try {
        patients = await PatientService.list();
    } catch (e) {
        console.error('SharedPatientsPage: Failed to fetch patients', e);
    }

    const isAdmin = user.role === 'ADMIN';

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Cadastro de Pacientes</h1>

            <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 300px' : '1fr', gap: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Lista de Pacientes</h2>
                    <PatientList patients={patients} canEdit={isAdmin} />
                </div>

                {isAdmin && (
                    <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', height: 'fit-content' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Novo Paciente</h2>
                        <PatientForm />
                    </div>
                )}
            </div>
        </div>
    );
}
