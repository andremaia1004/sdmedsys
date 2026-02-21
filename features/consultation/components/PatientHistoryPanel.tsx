'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { User, FileText, FilePlus, Activity, ClipboardList, Scroll } from 'lucide-react';
import { Patient } from '@/features/patients/types';
import { Consultation } from '@/features/consultation/types';
import { ClinicalDocument } from '@/features/documents/types';
import { getPatientTimelineAction } from '@/features/consultation/actions';
import { fetchPatientDocumentsAction } from '@/features/documents/actions';

interface Props {
    patient: Patient;
    consultationId: string;
}

export function PatientHistoryPanel({ patient, consultationId }: Props) {
    const [history, setHistory] = useState<Consultation[]>([]);
    const [documents, setDocuments] = useState<ClinicalDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchHistory() {
            try {
                const [consultationsRes, docsRes] = await Promise.all([
                    getPatientTimelineAction(patient.id),
                    fetchPatientDocumentsAction(patient.id)
                ]);
                setHistory((consultationsRes.data || []).filter(c => c.id !== consultationId));
                setDocuments(docsRes.data || []);
            } catch (error) {
                console.error("Failed to fetch patient history", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchHistory();
    }, [patient.id, consultationId]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '1rem', height: 'fit-content' }}>
            <Card>
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'var(--primary)', border: '2px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <User size={32} />
                    </div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>{patient.name}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                        {new Date().getFullYear() - new Date(patient.birth_date || '').getFullYear()} anos • {new Date(patient.birth_date || '').toLocaleDateString('pt-BR')}
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
                        {isLoading ? (
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
                                                {new Date(h.started_at).toLocaleDateString('pt-BR')}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 600, margin: '2px 0' }}>
                                                {h.chief_complaint || 'Atendimento'}
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
    );
}
