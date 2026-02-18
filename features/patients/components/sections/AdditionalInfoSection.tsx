import { Patient } from '../../types';
import styles from '../../styles/Patients.module.css';
import { Edit2 } from 'lucide-react';

interface Props {
    patient: Patient;
    onEdit: () => void;
    canEdit: boolean;
}

export const AdditionalInfoSection = ({ patient, onEdit, canEdit }: Props) => {
    return (
        <div className={styles.patientCard}>
            <div className={styles.cardHeader}>
                <h2>Informações Adicionais</h2>
                {canEdit && (
                    <button onClick={onEdit} className={styles.editBtn} title="Editar Informações">
                        <Edit2 size={16} />
                    </button>
                )}
            </div>
            <div className={styles.cardGrid}>
                <div className={styles.field}>
                    <label>Convênio / Plano</label>
                    <p>{patient.insurance || 'N/A'}</p>
                </div>
                <div className={styles.field}>
                    <label>Responsável</label>
                    <p>{patient.guardian_name || 'N/A'}</p>
                </div>
                <div className={styles.field}>
                    <label>Contato de Emergência</label>
                    <p>{patient.emergency_contact || 'N/A'}</p>
                </div>
                <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                    <label>Queixa Principal (Cadastro)</label>
                    <p>{patient.main_complaint || 'N/A'}</p>
                </div>
            </div>
        </div>
    );
};
