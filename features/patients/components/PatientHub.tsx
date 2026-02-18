'use client';

import React, { useState } from 'react';
import { Patient } from '../types';
// ClinicalSummaryService is server-side only and not used here
import { ClinicalSummary } from '@/features/consultation/types';
import PatientOverview from './PatientOverview';
import { PatientTimeline } from '@/features/patient-record/components/PatientTimeline';
// import PatientTimeline from './PatientTimeline'; // Legacy removed

import { PatientDocuments } from '@/features/documents/components/PatientDocuments';
import { PatientAttachments } from '@/features/documents/components/PatientAttachments';
import { PatientHeader } from './PatientHeader';
import styles from '../styles/Patients.module.css';

interface Props {
    patient: Patient;
    summary: ClinicalSummary | null;
    // timeline: ClinicalEntry[]; // Removed in favor of self-fetching component
    role: string;
    documentsCount?: number | null;
    attachmentsCount?: number | null;
    historyCount?: number | null;
    lastConsultationDate?: string | null;
    activeConsultationId?: string;
}

type Tab = 'data' | 'history' | 'documents' | 'attachments';

export default function PatientHub({
    patient,
    summary,
    // timeline,
    role,
    documentsCount,
    attachmentsCount,
    historyCount,
    lastConsultationDate,
    activeConsultationId
}: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('data');

    const isClinicalAllowed = role === 'ADMIN' || role === 'DOCTOR';

    return (
        <div className={styles.pageContainer}>
            <PatientHeader
                patient={patient}
                lastConsultationDate={lastConsultationDate}
            />

            <div className={styles.tabsContainer}>
                <div className={styles.tabList}>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'data' ? styles.active : ''}`}
                        onClick={() => setActiveTab('data')}
                    >
                        📂 Dados
                    </button>
                    {isClinicalAllowed && (
                        <button
                            className={`${styles.tabButton} ${activeTab === 'history' ? styles.active : ''}`}
                            onClick={() => setActiveTab('history')}
                        >
                            🩺 Histórico
                            {historyCount !== undefined && historyCount !== null && (
                                <span className={styles.badge}>{historyCount}</span>
                            )}
                        </button>
                    )}
                    {isClinicalAllowed && (
                        <button
                            className={`${styles.tabButton} ${activeTab === 'documents' ? styles.active : ''}`}
                            onClick={() => setActiveTab('documents')}
                        >
                            📜 Documentos
                            {documentsCount !== undefined && documentsCount !== null && (
                                <span className={styles.badge}>{documentsCount}</span>
                            )}
                        </button>
                    )}

                    {/* Attachments - Hidden for SECRETARY as per UX decision to prevent "blocked menu" feeling */}
                    {role !== 'SECRETARY' && (
                        <button
                            className={`${styles.tabButton} ${activeTab === 'attachments' ? styles.active : ''}`}
                            onClick={() => setActiveTab('attachments')}
                        >
                            📎 Anexos
                            {attachmentsCount !== undefined && attachmentsCount !== null && (
                                <span className={styles.badge}>{attachmentsCount}</span>
                            )}
                        </button>
                    )}
                </div>

                <div className={styles.tabPanel}>
                    {activeTab === 'data' && (
                        <PatientOverview
                            patient={patient}
                            summary={summary}
                            role={role}
                            onViewTimeline={() => setActiveTab('history')}
                        />
                    )}
                    {activeTab === 'history' && isClinicalAllowed && (
                        <PatientTimeline patientId={patient.id} />
                    )}
                    {activeTab === 'documents' && isClinicalAllowed && (
                        <PatientDocuments
                            patientId={patient.id}
                            patientName={patient.name}
                            activeConsultationId={activeConsultationId}
                        />
                    )}
                    {activeTab === 'attachments' && role !== 'SECRETARY' && (
                        <PatientAttachments patientId={patient.id} role={role} />
                    )}
                </div>
            </div>
        </div>
    );
}
