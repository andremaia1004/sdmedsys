'use client';

import React, { useState } from 'react';
import { Patient } from '../types';
import { ClinicalSummary } from '@/features/consultation/types';
import styles from '../styles/Patients.module.css';
import { IdentificationSection } from './sections/IdentificationSection';
import { ContactSection } from './sections/ContactSection';
import { AdditionalInfoSection } from './sections/AdditionalInfoSection';
import { PatientEditModal, EditSection } from './PatientEditModal';
import { useRouter } from 'next/navigation';

interface PatientOverviewProps {
    patient: Patient;
    summary: ClinicalSummary | null;
    role: string;
    onViewTimeline?: () => void;
}

export default function PatientOverview({ patient: initialPatient, summary, role, onViewTimeline }: PatientOverviewProps) {
    const [patient, setPatient] = useState(initialPatient);
    const [editSection, setEditSection] = useState<EditSection | null>(null);
    const router = useRouter();

    const isClinicalAllowed = role === 'ADMIN' || role === 'DOCTOR';
    // Allow editing to Admin, Doctor and Secretary (Secretary manages registration)
    const canEdit = role === 'ADMIN' || role === 'SECRETARY' || role === 'DOCTOR';

    const handleSuccess = (updated: Patient) => {
        setPatient(updated);
        router.refresh(); // Refresh server components to ensure sync
    };

    return (
        <div className={styles.overviewContainer}>
            <IdentificationSection
                patient={patient}
                onEdit={() => setEditSection('identification')}
                canEdit={canEdit}
            />

            <ContactSection
                patient={patient}
                onEdit={() => setEditSection('contact')}
                canEdit={canEdit}
            />

            <AdditionalInfoSection
                patient={patient}
                onEdit={() => setEditSection('additional')}
                canEdit={canEdit}
            />

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
                                <p>Responsável: <strong>{summary.doctor_name}</strong></p>
                            </div>
                            <div className={styles.viewTimeline}>
                                <button
                                    onClick={(e) => { e.preventDefault(); onViewTimeline?.(); }}
                                    className={styles.timelineLink}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                >
                                    Ver Linha do Tempo Completa →
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.emptySummary}>
                            <p>Nenhum registro clínico encontrado para este paciente.</p>
                        </div>
                    )}
                </div>
            )}

            {editSection && (
                <PatientEditModal
                    isOpen={!!editSection}
                    onClose={() => setEditSection(null)}
                    patient={patient}
                    section={editSection}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
}

