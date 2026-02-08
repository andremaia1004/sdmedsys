'use client';

import { useState, useEffect } from 'react';
import { Consultation, ClinicalEntry } from '@/features/consultation/types';
import { upsertClinicalEntryAction, finishConsultationAction, finalizeClinicalEntryAction, updatePatientFromConsultationAction, scheduleReturnAppointmentAction } from '../actions';
import PatientTimeline from '@/features/patients/components/PatientTimeline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import styles from '../styles/Consultation.module.css';
import { Patient, PatientInput } from '@/features/patients/types';

interface Props {
    consultation: Consultation;
    patient: Patient;
    initialEntry?: ClinicalEntry;
    timeline: ClinicalEntry[];
}

export default function ConsultationWorkspace({ consultation, patient, initialEntry, timeline }: Props) {
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
    const [patientDraft, setPatientDraft] = useState<PatientInput>({
        name: patient.name,
        document: patient.document,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        guardian_name: patient.guardian_name,
        insurance: patient.insurance,
        main_complaint: patient.main_complaint,
        emergency_contact: patient.emergency_contact,
        birthDate: patient.birthDate
    });
    const [patientSaving, setPatientSaving] = useState(false);
    const [patientSavedAt, setPatientSavedAt] = useState<Date | null>(null);
    const [patientMessage, setPatientMessage] = useState<string | null>(null);
    const [returnDate, setReturnDate] = useState('');
    const [returnTime, setReturnTime] = useState('');
    const [returnNotes, setReturnNotes] = useState('');
    const [returnSaving, setReturnSaving] = useState(false);
    const [returnMessage, setReturnMessage] = useState<string | null>(null);

    const handleSave = async (isFinal = false) => {
        if (entry.isFinal && !isFinal) return; // Locked

        setSaving(true);
        try {
            const res = await upsertClinicalEntryAction({
                ...entry as any,
                isFinal: isFinal
            });
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

    const updateField = (field: keyof ClinicalEntry, value: any) => {
        setEntry(prev => ({ ...prev, [field]: value }));
    };

    const updatePatientField = (field: keyof PatientInput, value: any) => {
        setPatientDraft(prev => ({ ...prev, [field]: value }));
    };

    const handlePatientSave = async () => {
        setPatientSaving(true);
        setPatientMessage(null);
        try {
            const res = await updatePatientFromConsultationAction(patient.id, patientDraft);
            if (res.success) {
                setPatientSavedAt(new Date());
            } else {
                setPatientMessage(res.error || 'Erro ao atualizar dados do paciente.');
            }
        } catch (err) {
            console.error('Patient update failed:', err);
            setPatientMessage('Erro ao atualizar dados do paciente.');
        } finally {
            setPatientSaving(false);
        }
    };

    const handleScheduleReturn = async () => {
        setReturnSaving(true);
        setReturnMessage(null);
        try {
            const res = await scheduleReturnAppointmentAction({
                patientId: patient.id,
                patientName: patientDraft.name,
                doctorId: consultation.doctorId,
                date: returnDate,
                time: returnTime,
                notes: returnNotes
            });
            if (res.success) {
                setReturnMessage('Retorno agendado com sucesso!');
                setReturnDate('');
                setReturnTime('');
                setReturnNotes('');
            } else {
                setReturnMessage(res.error || 'Erro ao agendar retorno.');
            }
        } catch (err) {
            console.error('Return schedule failed:', err);
            setReturnMessage('Erro ao agendar retorno.');
        } finally {
            setReturnSaving(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                    <div>
                        <h1 className={styles.patientName}>{patient.name}</h1>
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
                    <Card header="Dados do Paciente">
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input label="Nome" value={patientDraft.name} disabled />
                                <Input label="Documento" value={patientDraft.document} disabled />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input label="Data de Nascimento" value={patientDraft.birthDate} disabled />
                                <Input
                                    label="Telefone"
                                    value={patientDraft.phone}
                                    onChange={(e) => updatePatientField('phone', e.target.value)}
                                />
                            </div>
                            <Input
                                label="E-mail"
                                value={patientDraft.email || ''}
                                onChange={(e) => updatePatientField('email', e.target.value)}
                            />
                            <Input
                                label="Endereço"
                                value={patientDraft.address || ''}
                                onChange={(e) => updatePatientField('address', e.target.value)}
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input
                                    label="Responsável"
                                    value={patientDraft.guardian_name || ''}
                                    onChange={(e) => updatePatientField('guardian_name', e.target.value)}
                                />
                                <Input
                                    label="Contato de Emergência"
                                    value={patientDraft.emergency_contact || ''}
                                    onChange={(e) => updatePatientField('emergency_contact', e.target.value)}
                                />
                            </div>
                            <Input
                                label="Convênio"
                                value={patientDraft.insurance || ''}
                                onChange={(e) => updatePatientField('insurance', e.target.value)}
                            />
                            <Input
                                label="Queixa Principal (resumo)"
                                value={patientDraft.main_complaint || ''}
                                onChange={(e) => updatePatientField('main_complaint', e.target.value)}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Button variant="primary" onClick={handlePatientSave} disabled={patientSaving}>
                                    {patientSaving ? 'Salvando...' : 'Salvar Dados do Paciente'}
                                </Button>
                                {patientSavedAt && (
                                    <span style={{ color: 'var(--success)' }}>
                                        ✓ Atualizado {patientSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                            {patientMessage && (
                                <span style={{ color: 'var(--danger)' }}>{patientMessage}</span>
                            )}
                        </div>
                    </Card>

                    <div style={{ marginTop: '1.5rem' }}>
                        <Card header="Agendar Retorno">
                            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <Input
                                        label="Data"
                                        type="date"
                                        value={returnDate}
                                        onChange={(e) => setReturnDate(e.target.value)}
                                    />
                                    <Input
                                        label="Hora"
                                        type="time"
                                        value={returnTime}
                                        onChange={(e) => setReturnTime(e.target.value)}
                                    />
                                </div>
                                <Input
                                    label="Observações"
                                    value={returnNotes}
                                    onChange={(e) => setReturnNotes(e.target.value)}
                                />
                                <Button variant="accent" onClick={handleScheduleReturn} disabled={returnSaving}>
                                    {returnSaving ? 'Agendando...' : 'Agendar Retorno'}
                                </Button>
                                {returnMessage && (
                                    <span style={{ color: returnMessage.includes('sucesso') ? 'var(--success)' : 'var(--danger)' }}>
                                        {returnMessage}
                                    </span>
                                )}
                            </div>
                        </Card>
                    </div>

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
