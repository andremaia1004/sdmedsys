import { Patient } from '../types';
import { ClinicalSummary } from '@/features/consultation/service.summary';
import styles from '../styles/Patients.module.css';

interface PatientOverviewProps {
    patient: Patient;
    summary: ClinicalSummary | null;
    role: string;
}

export default function PatientOverview({ patient, summary, role }: PatientOverviewProps) {
    const isClinicalAllowed = role === 'ADMIN' || role === 'DOCTOR';

    return (
        <div className={styles.overviewContainer}>
            <div className={styles.patientCard}>
                <div className={styles.cardHeader}>
                    <h2>Dados do Paciente</h2>
                    <span className={styles.patientId}>ID: {patient.id.substring(0, 8)}</span>
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
                    <div className={styles.field}>
                        <label>Telefone</label>
                        <p>{patient.phone || 'N/A'}</p>
                    </div>
                    <div className={styles.field}>
                        <label>E-mail</label>
                        <p>{patient.email || 'N/A'}</p>
                    </div>
                    {patient.address && (
                        <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                            <label>Endereço</label>
                            <p>{patient.address}</p>
                        </div>
                    )}
                    {patient.insurance && (
                        <div className={styles.field}>
                            <label>Convênio / Plano</label>
                            <p>{patient.insurance}</p>
                        </div>
                    )}
                    {patient.guardian_name && (
                        <div className={styles.field}>
                            <label>Responsável</label>
                            <p>{patient.guardian_name}</p>
                        </div>
                    )}
                    {patient.emergency_contact && (
                        <div className={styles.field}>
                            <label>Contato de Emergência</label>
                            <p>{patient.emergency_contact}</p>
                        </div>
                    )}
                    {patient.main_complaint && (
                        <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                            <label>Queixa Principal (Cadastro)</label>
                            <p>{patient.main_complaint}</p>
                        </div>
                    )}
                </div>
            </div>

            {isClinicalAllowed && (
                <div className={`${styles.patientCard} ${styles.summaryCard}`}>
                    <div className={styles.cardHeader}>
                        <h2>Resumo Clínico</h2>
                        {summary && (
                            <span className={styles.dateTag}>
                                Última consulta: {new Date(summary.date).toLocaleDateString('pt-BR')}
                            </span>
                        )}
                    </div>

                    {summary ? (
                        <div className={styles.summaryContent}>
                            <div className={styles.summaryField}>
                                <label>Diagnóstico (Último)</label>
                                <p>{summary.diagnosis || 'Não informado'}</p>
                            </div>
                            <div className={styles.summaryField}>
                                <label>Conduta</label>
                                <p>{summary.conduct || 'Não informada'}</p>
                            </div>
                            <div className={styles.doctorInfo}>
                                <p>Responsável: <strong>{summary.doctorName}</strong></p>
                            </div>
                            <div className={styles.viewTimeline}>
                                <a href="#" className={styles.timelineLink}>Ver Linha do Tempo Completa →</a>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.emptySummary}>
                            <p>Nenhum registro clínico encontrado para este paciente.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
