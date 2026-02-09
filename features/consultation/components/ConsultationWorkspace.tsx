'use client';

import { useState } from 'react';
import { Consultation, ClinicalEntry, ClinicalEntryInput } from '@/features/consultation/types';
import { upsertClinicalEntryAction, finishConsultationAction } from '../actions';
import PatientTimeline from '@/features/patients/components/PatientTimeline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import styles from '../styles/Consultation.module.css';

interface Props {
    consultation: Consultation;
    patientName: string;
    initialEntry?: ClinicalEntry;
    timeline: ClinicalEntry[];
}

export default function ConsultationWorkspace({ consultation, patientName, initialEntry, timeline }: Props) {
    const [entry, setEntry] = useState<Partial<ClinicalEntry>>(initialEntry || {
        consultationId: consultation.id,
        patientId: consultation.patientId,
        chiefComplaint: '',
        diagnosis: '',
        conduct: '',
        observations: '',
        freeNotes: '',
        isFinal: false
    });
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const handleSave = async (isFinal = false) => {
        if (entry.isFinal && !isFinal) return; // Locked

        setSaving(true);
        try {
            // entry is Partial<ClinicalEntry>, but upsert needs ClinicalEntryInput
            // We cast to ClinicalEntryInput based on fields we have. 
            // Warning: mandatory fields must be present or handled by Service/DB default.
            const payload = {
                ...entry,
                isFinal: isFinal
            } as ClinicalEntryInput & { id?: string };

            const res = await upsertClinicalEntryAction(payload);
            if (res.success && res.entry) {
                setEntry(res.entry);
                setLastSaved(new Date());
            }
        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setSaving(false);
        }
    };

    const updateField = <K extends keyof ClinicalEntry>(field: K, value: ClinicalEntry[K]) => {
        setEntry(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                    <div>
                        <h1 className={styles.patientName}>{patientName}</h1>
                        <div className={styles.meta}>
                            <div className={styles.metaItem}>
                                <span>📅</span> {new Date(consultation.startedAt).toLocaleDateString('pt-BR')}
                            </div>
                            <div className={styles.metaItem}>
                                <span>🕒</span> Iniciado às {new Date(consultation.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                    <div className={styles.saveStatus}>
                        {saving ? (
                            <span style={{ color: 'var(--primary)' }}>◌ Salvando...</span>
                        ) : lastSaved ? (
                            <span style={{ color: 'var(--success)' }}>✓ Salvo {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        ) : null}
                    </div>
                </div>
            </header>

            <div className={styles.workspaceGrid}>
                <Card header="Atendimento Estruturado">
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                            <label className={styles.label}>Queixa Principal</label>
                            <textarea
                                className={styles.smallTextarea}
                                value={entry.chiefComplaint || ''}
                                onChange={(e) => updateField('chiefComplaint', e.target.value)}
                                onBlur={() => handleSave()}
                                placeholder="Relato do paciente..."
                            />

                            <label className={styles.label}>Diagnóstico / Hipótese</label>
                            <textarea
                                className={styles.smallTextarea}
                                value={entry.diagnosis || ''}
                                onChange={(e) => updateField('diagnosis', e.target.value)}
                                onBlur={() => handleSave()}
                                placeholder="CID ou descrição clínica..."
                            />

                            <label className={styles.label}>Conduta / Prescrição</label>
                            <textarea
                                className={styles.smallTextarea}
                                value={entry.conduct || ''}
                                onChange={(e) => updateField('conduct', e.target.value)}
                                onBlur={() => handleSave()}
                                placeholder="Medicamentos, exames, orientações..."
                            />
                        </div>
                    </div>
                </Card>

                <div className={styles.sideNotes}>
                    <Card header="Histórico do Paciente">
                        <div style={{ padding: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                            <PatientTimeline entries={timeline.filter(e => e.id !== entry.id)} />
                        </div>
                    </Card>

                    <div style={{ marginTop: '1.5rem' }}>
                        <Card header="Notas Livres & Evolução">
                            <div style={{ padding: '1rem' }}>
                                <textarea
                                    className={styles.mainTextarea}
                                    value={entry.freeNotes || ''}
                                    onChange={(e) => updateField('freeNotes', e.target.value)}
                                    onBlur={() => handleSave()}
                                    placeholder="Outras informações relevantes..."
                                />
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            <footer className={styles.footer}>
                <Button
                    variant="ghost"
                    onClick={() => handleSave()}
                    disabled={saving || entry.isFinal}
                >
                    Salvar Rascunho
                </Button>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a
                        href={`/api/documents/prescription/${consultation.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.pdfLink}
                    >
                        📄 Receita (PDF)
                    </a>
                    <a
                        href={`/api/documents/certificate/${consultation.id}?days=1`}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.pdfLink}
                    >
                        📜 Atestado (PDF)
                    </a>
                </div>

                <form action={async () => {
                    if (confirm('Deseja FINALIZAR o prontuário? Após finalizado, o registro não poderá mais ser editado.')) {
                        await handleSave(true);
                        await finishConsultationAction(consultation.id);
                    }
                }}>
                    <Button
                        type="submit"
                        variant="accent"
                        size="lg"
                        disabled={saving || entry.isFinal}
                    >
                        {entry.isFinal ? 'Atendimento Finalizado' : 'Finalizar Atendimento'}
                    </Button>
                </form>
            </footer>

            {entry.isFinal && (
                <div style={{
                    position: 'fixed',
                    top: '1rem',
                    right: '1rem',
                    backgroundColor: 'var(--success)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                    🔒 REGISTRO FINALIZADO
                </div>
            )}
        </div>
    );
}
