'use client';

import { ClinicalEntry } from '@/features/consultation/types';
import { Card } from '@/components/ui/Card';
import styles from './Timeline.module.css';

interface Props {
    entries: ClinicalEntry[];
}

export default function PatientTimeline({ entries }: Props) {
    if (!entries || entries.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                Nenhum histórico clínico encontrado para este paciente.
            </div>
        );
    }

    return (
        <div className={styles.timeline}>
            {entries.map((entry, index) => (
                <div key={entry.id} className={styles.timelineItem}>
                    <div className={styles.marker}></div>
                    <div className={styles.content}>
                        <div className={styles.date}>
                            {new Date(entry.createdAt).toLocaleDateString('pt-BR')} às {new Date(entry.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <Card header={entry.chiefComplaint || 'Atendimento'}>
                            <div className={styles.entryData}>
                                {entry.diagnosis && (
                                    <div className={styles.field}>
                                        <span className={styles.fieldLabel}>Diagnóstico:</span>
                                        <p>{entry.diagnosis}</p>
                                    </div>
                                )}
                                {entry.conduct && (
                                    <div className={styles.field}>
                                        <span className={styles.fieldLabel}>Conduta:</span>
                                        <p>{entry.conduct}</p>
                                    </div>
                                )}
                                {entry.freeNotes && (
                                    <div className={styles.field}>
                                        <span className={styles.fieldLabel}>Evolução:</span>
                                        <div className={styles.freeText}>{entry.freeNotes}</div>
                                    </div>
                                )}
                                <div className={styles.entryFooter}>
                                    <span>Médico ID: {entry.doctorUserId.slice(0, 8)}...</span>
                                    {entry.isFinal && <span className={styles.finalBadge}>🔒 FINALIZADO</span>}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            ))}
        </div>
    );
}
