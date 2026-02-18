import { Patient } from '../../types';
import styles from '../../styles/Patients.module.css';
import { Edit2 } from 'lucide-react';

interface Props {
    patient: Patient;
    onEdit: () => void;
    canEdit: boolean;
}

export const ContactSection = ({ patient, onEdit, canEdit }: Props) => {
    return (
        <div className={styles.patientCard}>
            <div className={styles.cardHeader}>
                <h2>Contato e Endereço</h2>
                {canEdit && (
                    <button onClick={onEdit} className={styles.editBtn} title="Editar Contato">
                        <Edit2 size={16} />
                    </button>
                )}
            </div>
            <div className={styles.cardGrid}>
                <div className={styles.field}>
                    <label>Telefone</label>
                    <p>{patient.phone || 'N/A'}</p>
                </div>
                <div className={styles.field}>
                    <label>E-mail</label>
                    <p>{patient.email || 'N/A'}</p>
                </div>
                <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                    <label>Endereço</label>
                    <p>{patient.address || 'N/A'}</p>
                </div>
            </div>
        </div>
    );
};
