'use client';

import React, { useState } from 'react';
import { Patient } from '../types';
import { ClinicalSummary } from '@/features/consultation/service.summary';
import { ClinicalEntry } from '@/features/consultation/types';
import PatientOverview from './PatientOverview';
import PatientTimeline from './PatientTimeline';
import { PatientDocuments } from '@/features/documents/components/PatientDocuments';
import { PatientAttachments } from '@/features/documents/components/PatientAttachments';
import styles from '../styles/Patients.module.css';

interface Props {
    patient: Patient;
    summary: ClinicalSummary | null;
    timeline: ClinicalEntry[];
    role: string;
}

type Tab = 'data' | 'history' | 'documents' | 'attachments';

export default function PatientHub({ patient, summary, timeline, role }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('data');

    const isClinicalAllowed = role === 'ADMIN' || role === 'DOCTOR';

    return (
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
                    </button>
                )}
                {isClinicalAllowed && (
                    <button
                        className={`${styles.tabButton} ${activeTab === 'documents' ? styles.active : ''}`}
                        onClick={() => setActiveTab('documents')}
                    >
                        📜 Documentos
                    </button>
                )}
                <button
                    className={`${styles.tabButton} ${activeTab === 'attachments' ? styles.active : ''}`}
                    onClick={() => setActiveTab('attachments')}
                >
                    📎 Anexos
                </button>
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
                    <PatientTimeline entries={timeline} />
                )}
                {activeTab === 'documents' && isClinicalAllowed && (
                    <PatientDocuments patientId={patient.id} />
                )}
                {activeTab === 'attachments' && (
                    <PatientAttachments patientId={patient.id} role={role} />
                )}
            </div>
        </div>
    );
}
