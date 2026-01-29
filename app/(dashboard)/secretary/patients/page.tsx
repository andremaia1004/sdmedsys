import { fetchPatientsAction } from '@/features/patients/actions';
import PatientList from '@/features/patients/components/PatientList';
import PatientForm from '@/features/patients/components/PatientForm';
import { Card } from '@/components/ui/Card';
import styles from '@/features/patients/styles/Patients.module.css';

export default async function SecretaryPatientsPage() {
    const patients = await fetchPatientsAction();

    return (
        <div className={styles.pageLayout}>
            <div className={styles.mainCol}>
                <Card header="Diretório de Pacientes" padding="none">
                    <PatientList patients={patients} canEdit={true} />
                </Card>
            </div>

            <div className={styles.sideCol}>
                <Card header="Novo Cadastro">
                    <PatientForm />
                </Card>
            </div>
        </div>
    );
}
