'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Consultation } from '../types';
import { Patient } from '@/features/patients/types';
import { saveConsultationFieldsAction, finishConsultationAction, getPatientTimelineAction } from '../actions';
import { fetchPatientDocumentsAction } from '@/features/documents/actions';
import { ClinicalDocument } from '@/features/documents/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle, AlertTriangle, FileText, User, FilePlus, Activity, ClipboardList, Scroll } from 'lucide-react';
import { ClinicalDocumentModal } from '@/features/documents/components/ClinicalDocumentModal';

interface Props {
    consultation: Consultation;
    patient: Patient;
}

export default function ConsultationWorkspace({ consultation, patient }: Props) {
    const router = useRouter();
    const [fields, setFields] = useState({
        chiefComplaint: consultation.chiefComplaint || '',
        physicalExam: consultation.physicalExam || '',
        diagnosis: consultation.diagnosis || '',
        conduct: consultation.conduct || ''
    });
    const [status, setStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
    const [isFinished, setIsFinished] = useState(!!consultation.finishedAt);
    const [finishError, setFinishError] = useState<string | null>(null);
    const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);

    // Auto-save Logic for Structured Fields
    useEffect(() => {
        if (isFinished) return;

        const timer = setTimeout(async () => {
            const hasChanges =
                fields.chiefComplaint !== consultation.chiefComplaint ||
                fields.physicalExam !== consultation.physicalExam ||
                fields.diagnosis !== consultation.diagnosis ||
                fields.conduct !== consultation.conduct;

            if (hasChanges && status === 'unsaved') {
                setStatus('saving');
                const res = await saveConsultationFieldsAction(consultation.id, fields);
                if (res.success) {
                    setStatus('saved');
                } else {
                    setStatus('unsaved');
                    console.error('Failed to save fields:', res.error);
                }
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [fields, consultation.id, status, isFinished, consultation.chiefComplaint, consultation.physicalExam, consultation.diagnosis, consultation.conduct]);

    const handleFieldChange = (name: keyof typeof fields, value: string) => {
        if (isFinished) return;
        setFields(prev => ({ ...prev, [name]: value }));
        setStatus('unsaved');
    };

    const handleFinish = async () => {
        if (!confirm('Tem certeza que deseja finalizar o atendimento? Esta ação não pode ser desfeita e o prontuário será bloqueado.')) return;

        setFinishError(null);
        setStatus('saving');

        // Ensure final state is saved
        await saveConsultationFieldsAction(consultation.id, fields);

        const res = await finishConsultationAction(consultation.id);
        if (res.success) {
            setIsFinished(true);
            router.push('/doctor/queue');
        } else {
            setFinishError(res.error || 'Erro ao finalizar consulta.');
            setStatus('saved');
        }
    };

    const [history, setHistory] = useState<Consultation[]>([]);
    const [documents, setDocuments] = useState<ClinicalDocument[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    // Fetch Patient History
    useEffect(() => {
        async function fetchHistory() {
            const [consultations, docs] = await Promise.all([
                getPatientTimelineAction(patient.id),
                fetchPatientDocumentsAction(patient.id)
            ]);
            setHistory(consultations.filter(c => c.id !== consultation.id));
            setDocuments(docs);
            setIsLoadingHistory(false);
        }
        fetchHistory();
    }, [patient.id, consultation.id]);

    const renderSection = (label: string, name: keyof typeof fields, placeholder: string, rows: number = 4) => (
        <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                {label}
            </label>
            <textarea
                value={fields[name]}
                onChange={(e) => handleFieldChange(name, e.target.value)}
                disabled={isFinished}
                placeholder={placeholder}
                rows={rows}
                style={{
                    width: '100%',
                    resize: 'vertical',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.95rem',
                    lineHeight: '1.5',
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                    backgroundColor: isFinished ? '#f1f5f9' : '#fff'
                }}
            />
        </div>
    );

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', minHeight: 'calc(100vh - 120px)' }}>

            {/* Left Panel: Patient Info & Clinical Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '1rem', height: 'fit-content' }}>
                <Card>
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'var(--primary)', border: '2px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <User size={32} />
                        </div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>{patient.name}</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                            {new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} anos • {new Date(patient.birthDate).toLocaleDateString('pt-BR')}
                        </p>
                        <div style={{ marginTop: '0.75rem', padding: '0.35rem 0.75rem', background: '#f1f5f9', color: '#475569', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                            CPF: {patient.document}
                        </div>
                    </div>
                </Card>

                <Card header="Histórico do Paciente">
                    <div style={{ maxHeight: '600px', overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Consultations Subsection */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                                <FileText size={14} /> Atendimentos
                            </div>
                            {isLoadingHistory ? (
                                <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b', fontSize: '0.85rem' }}>Carregando...</div>
                            ) : history.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b', fontSize: '0.85rem' }}>Nenhum anterior.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {history.map((h, idx) => (
                                        <div key={h.id} style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
                                            {idx !== history.length - 1 && (
                                                <div style={{ position: 'absolute', left: '7.5px', top: '15px', bottom: '-15px', width: '1px', background: '#e2e8f0' }} />
                                            )}
                                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff', border: '2px solid var(--primary)', zIndex: 1, marginTop: '2px' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                                                    {new Date(h.startedAt).toLocaleDateString('pt-BR')}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 600, margin: '2px 0' }}>
                                                    {h.chiefComplaint || 'Atendimento'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Documents Subsection */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                                <FilePlus size={14} /> Documentos
                            </div>
                            {documents.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b', fontSize: '0.85rem' }}>Nenhum emitido.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {documents.map(doc => (
                                        <div key={doc.id} style={{ padding: '0.75rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ color: 'var(--primary)', background: '#fff', padding: '0.4rem', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                                {doc.type === 'prescription' && <FileText size={16} />}
                                                {doc.type === 'certificate' && <Activity size={16} />}
                                                {doc.type === 'exam_request' && <ClipboardList size={16} />}
                                                {doc.type === 'report' && <Scroll size={16} />}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>
                                                    {doc.type === 'prescription' && 'Receituário'}
                                                    {doc.type === 'certificate' && 'Atestado'}
                                                    {doc.type === 'exam_request' && 'Pedido de Exame'}
                                                    {doc.type === 'report' && 'Laudo'}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                                    {new Date(doc.issuedAt).toLocaleDateString('pt-BR')}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </Card>
            </div>

            {/* Right Panel: Structured Clinical Forms */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <Card className="flex-1">
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                            <FileText size={18} />
                            ATENDIMENTO CLÍNICO
                        </div>
                        <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {status === 'saving' && <span style={{ color: '#ea580c', fontWeight: 600 }}>Salvando...</span>}
                            {status === 'saved' && <span style={{ color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}><CheckCircle size={14} /> Alterações Salvas</span>}
                            {status === 'unsaved' && <span style={{ color: '#64748b' }}>Editando...</span>}
                            {isFinished && <span style={{ background: '#fef2f2', color: '#991b1b', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>PRONTUÁRIO BLOQUEADO</span>}
                        </div>
                    </div>

                    <div style={{ padding: '2rem' }}>
                        {renderSection('1. Anamnese / Queixa Principal', 'chiefComplaint', 'Descreva o motivo da consulta e histórico do paciente...', 6)}
                        {renderSection('2. Exame Físico', 'physicalExam', 'Descreva os achados clínicos e sinais vitais...', 5)}
                        {renderSection('3. Diagnóstico (Hipótese)', 'diagnosis', 'Indique as impressões diagnósticas ou CID-10...', 2)}
                        {renderSection('4. Plano Terapêutico / Conduta', 'conduct', 'Descreva a conduta, medicações orientadas e próximos passos...', 5)}
                    </div>

                    <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)', background: '#f8fafc', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
                        {finishError && <div style={{ color: '#dc2626', fontSize: '0.9rem', display: 'flex', alignItems: 'center', marginRight: 'auto' }}><AlertTriangle size={16} style={{ marginRight: '4px' }} /> {finishError}</div>}

                        {!isFinished && (
                            <>
                                <Button
                                    variant="secondary"
                                    onClick={() => setIsPrescriptionOpen(true)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
                                >
                                    <FilePlus size={18} />
                                    Gerar Documentos
                                </Button>

                                <Button
                                    variant="primary"
                                    onClick={handleFinish}
                                    disabled={status === 'saving'}
                                    style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 700, padding: '0.6rem 1.5rem' }}
                                >
                                    <CheckCircle size={18} style={{ marginRight: '8px' }} />
                                    Finalizar Atendimento
                                </Button>
                            </>
                        )}
                        {isFinished && (
                            <Button
                                variant="secondary"
                                onClick={() => router.push('/doctor/queue')}
                                style={{ fontWeight: 600 }}
                            >
                                Voltar para a Fila
                            </Button>
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
