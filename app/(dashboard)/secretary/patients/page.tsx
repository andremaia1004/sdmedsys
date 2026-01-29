import PatientList from '@/features/patients/components/PatientList';
import PatientForm from '@/features/patients/components/PatientForm';
import { Card } from '@/components/ui/Card';
import styles from '@/features/patients/styles/Patients.module.css';

export default function SecretaryPatientsPage() {
    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <h1 className={styles.title}>Patients</h1>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Secretary Management</div>
            </header>

            <div className={styles.grid}>
                <Card header="Patient Directory" padding="none">
                    <PatientList role="SECRETARY" />
                </Card>

                <Card header="Quick Register">
                    <PatientForm />
                </Card>
            </div>
        </div>
    );
}
