'use client';

import { useState } from 'react';
import { Consultation } from '@/features/consultation/types';
import { updateClinicalNotesAction, finishConsultationAction } from '../actions';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import styles from '../styles/Consultation.module.css';

export default function ConsultationWorkspace({ consultation, patientName }: { consultation: Consultation, patientName: string }) {
    const [notes, setNotes] = useState(consultation.clinicalNotes);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateClinicalNotesAction(consultation.id, notes);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.patientName}>{patientName}</h1>
                <div className={styles.meta}>
                    <div className={styles.metaItem}>
                        <span>📅</span> {new Date(consultation.startedAt).toLocaleDateString('pt-BR')}
                    </div>
                    <div className={styles.metaItem}>
                        <span>🕒</span> Iniciado às {new Date(consultation.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </header>

            <div className={styles.notesArea}>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 700, fontSize: '0.875rem' }}>
                    OBSERVAÇÕES CLÍNICAS & EVOLUÇÃO
                </label>
                <textarea
                    className={styles.textarea}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={handleSave}
                    placeholder="Comece a digitar as notas clínicas aqui..."
                />
                <div className={styles.statusInfo}>
                    {saving ? 'Salvando alterações...' : '✓ Todas as alterações foram salvas'}
                </div>
            </div>

            <footer className={styles.footer}>
                <form action={async () => {
                    if (confirm('Tem certeza que deseja finalizar este atendimento?')) {
                        await handleSave();
                        await finishConsultationAction(consultation.id);
                    }
                }}>
                    <Button
                        type="submit"
                        variant="accent"
                        size="lg"
                    >
                        Finalizar Atendimento
                    </Button>
                </form>
            </footer>
        </div>
    );
}
