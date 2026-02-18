import { Patient } from '../../types';
import styles from '../../styles/Patients.module.css';
import { Edit2 } from 'lucide-react';

interface Props {
    patient: Patient;
    onEdit: () => void;
    canEdit: boolean;
}

export const IdentificationSection = ({ patient, onEdit, canEdit }: Props) => {
    return (
        <div className={styles.patientCard}>
            <div className={styles.cardHeader}>
                <h2>Identificação</h2>
                {canEdit && (
                    <button onClick={onEdit} className={styles.editBtn} title="Editar Identificação">
                        <Edit2 size={16} />
                    </button>
                )}
            </div>
            <div className={styles.cardGrid}>
                <div className={styles.field}>
                    <label>Nome Completo</label>
                    <p>{patient.name}</p>
                </div>
                <div className={styles.field}>
                    <label>CPF / Documento</label>
                    <p>{patient.document || 'N/A'}</p>
                </div>
                <div className={styles.field}>
                    <label>Data de Nascimento</label>
                    <p>{patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('pt-BR') : 'N/A'}</p>
                </div>
            </div>
        </div>
    );
};
