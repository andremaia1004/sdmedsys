'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { Consultation } from '../types';
import { Patient } from '@/features/patients/types';
import { saveConsultationNotesAction, finishConsultationAction } from '../actions';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button'; // Assuming Button exists
import { CheckCircle, AlertTriangle, FileText, User, FilePlus } from 'lucide-react';
import { ClinicalDocumentModal } from '@/features/documents/components/ClinicalDocumentModal';
import styles from '../styles/Consultation.module.css'; // I need to create this CSS or use inline

interface Props {
    consultation: Consultation;
    patient: Patient;
}

export default function ConsultationWorkspace({ consultation, patient }: Props) {
    const router = useRouter();
    const [notes, setNotes] = useState(consultation.clinicalNotes || '');
    const [status, setStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
    const [isFinished, setIsFinished] = useState(!!consultation.finishedAt);
    const [finishError, setFinishError] = useState<string | null>(null);
    const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);

    // Auto-save Logic
    useEffect(() => {
        if (isFinished) return;

        const timer = setTimeout(async () => {
            if (notes !== consultation.clinicalNotes && status === 'unsaved') {
                setStatus('saving');
                const res = await saveConsultationNotesAction(consultation.id, notes);
                if (res.success) {
                    setStatus('saved');
                } else {
                    setStatus('unsaved'); // Retry logic could be added
                    console.error('Failed to save notes:', res.error);
                }
            }
        }, 2000); // 2 seconds debounce

        return () => clearTimeout(timer);
    }, [notes, consultation.id, status, isFinished]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (isFinished) return;
        setNotes(e.target.value);
        setStatus('unsaved');
    };

    const handleFinish = async () => {
        if (!confirm('Tem certeza que deseja finalizar o atendimento? Esta ação não pode ser desfeita.')) return;

        setFinishError(null);
        setStatus('saving'); // Block UI

        // Ensure notes are saved first
        await saveConsultationNotesAction(consultation.id, notes);

        const res = await finishConsultationAction(consultation.id);
        if (res.success) {
            setIsFinished(true);
            router.push('/doctor/queue'); // Redirect back to queue
        } else {
            setFinishError(res.error || 'Erro ao finalizar consulta.');
            setStatus('saved'); // Re-enable UI
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', height: 'calc(100vh - 100px)' }}>

            {/* Left Panel: Patient Info & History (Placeholder for now) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Card>
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: '#64748b' }}>
                            <User size={40} />
                        </div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>{patient.name}</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                            {new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} anos
                        </p>
                        <div style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#dbeafe', color: '#1e40af', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600 }}>
                            {patient.document}
                        </div>
                    </div>
                </Card>

                {/* Future: Patient Timeline Component */}
                <Card header="Histórico Recente">
                    <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
                        Visualização de histórico em breve.
                    </div>
                </Card>
            </div>

            {/* Right Panel: Clinical Notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Card className="flex-1" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--primary)' }}>
                            <FileText size={18} />
                            Prontuário Eletrônico
                        </div>
                        <div style={{ fontSize: '0.8rem', color: status === 'saving' ? '#ea580c' : status === 'saved' ? '#16a34a' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {status === 'saving' && 'Salvando...'}
                            {status === 'saved' && <><CheckCircle size={14} /> Salvo</>}
                            {status === 'unsaved' && <span style={{ color: '#ea580c' }}>Não salvo</span>}
                        </div>
                    </div>

                    <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                        <textarea
                            value={notes}
                            onChange={handleChange}
                            disabled={isFinished}
                            placeholder="Descreva a anamnese, exame físico, diagnóstico e conduta..."
                            style={{
                                flex: 1,
                                width: '100%',
                                resize: 'none',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                padding: '1rem',
                                fontSize: '1rem',
                                lineHeight: '1.6',
                                outline: 'none',
                                fontFamily: 'inherit',
                                backgroundColor: isFinished ? '#f1f5f9' : '#fff'
                            }}
                        />
                    </div>

                    <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: '#f8fafc', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        {finishError && <div style={{ color: '#dc2626', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}><AlertTriangle size={16} style={{ marginRight: '4px' }} /> {finishError}</div>}

                        {!isFinished && (
                            <>
                                <Button
                                    variant="secondary"
                                    onClick={() => setIsPrescriptionOpen(true)}
                                    title="Gerar Documento"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <FilePlus size={18} />
                                    Documentos
                                </Button>

                                <Button
                                    variant="primary"
                                    onClick={handleFinish}
                                    disabled={status === 'saving'}
                                    style={{ background: 'var(--success)', borderColor: 'var(--success)' }}
                                >
                                    <CheckCircle size={18} style={{ marginRight: '8px' }} />
                                    Finalizar Atendimento
                                </Button>
                            </>
                        )}
                    </div>
                </Card>
            </div>

            <ClinicalDocumentModal
                isOpen={isPrescriptionOpen}
                onClose={() => setIsPrescriptionOpen(false)}
                patientId={patient.id}
                consultationId={consultation.id}
                patientName={patient.name}
            />
        </div>
    );
}
