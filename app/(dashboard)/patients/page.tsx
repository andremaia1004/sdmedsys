export const dynamic = 'force-dynamic';

import PatientList from '@/features/patients/components/PatientList';
import PatientModalWrapper from '@/features/patients/components/PatientModalWrapper';
import { fetchPatientsAction } from '@/features/patients/actions';
import { requireRole } from '@/lib/session';
import { Patient } from '@/features/patients/types';

export default async function SharedPatientsPageResource() {
    const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);
    let patients: Patient[] = [];
    try {
        patients = await fetchPatientsAction();
    } catch (e) {
        console.error('SharedPatientsPage: Failed to fetch patients', e);
    }

    const canManagePatients = user.role === 'ADMIN' || user.role === 'SECRETARY';

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Cadastro de Pacientes</h1>
                <PatientModalWrapper canCreate={canManagePatients} />
            </div>

            <div>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Lista de Pacientes</h2>
                <PatientList patients={patients} canEdit={canManagePatients} />
            </div>
        </div>
    );
}
