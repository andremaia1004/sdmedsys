'use client';

import React, { useState, useEffect } from 'react';
import { generatePrescriptionAction, generateCertificateAction, generateReportAction, generateExamRequestAction } from '../actions';
import { X, FileText, Download, Loader2, Scroll, Activity, ClipboardList } from 'lucide-react';
import styles from '@/components/ui/Modal.module.css';

export type DocumentType = 'prescription' | 'certificate' | 'report' | 'exam_request';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    consultationId: string | null;
    patientName: string;
    items?: DocumentType[]; // Allow filtering if needed
    initialType?: DocumentType;
}

export function ClinicalDocumentModal({ isOpen, onClose, patientId, consultationId, patientName, items, initialType = 'prescription' }: Props) {
    const [type, setType] = useState<DocumentType>(initialType);
    const [loading, setLoading] = useState(false);

    // Prescription Fields
    const [medications, setMedications] = useState('');
    const [instructions, setInstructions] = useState('');

    // Certificate Fields
    const [days, setDays] = useState<string>('');
    const [cid, setCid] = useState('');
    const [observation, setObservation] = useState('');

    // Exam Request Fields
    const [examList, setExamList] = useState('');
    const [justification, setJustification] = useState('');

    // Report Fields
    const [content, setContent] = useState('');

    useEffect(() => {
        if (isOpen && initialType) setType(initialType);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialType]);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        setLoading(true);
        let res;

        if (type === 'prescription') {
            if (!medications.trim()) { alert('Preencha os medicamentos'); setLoading(false); return; }
            res = await generatePrescriptionAction(patientId, consultationId, medications, instructions);
        } else if (type === 'certificate') {
            res = await generateCertificateAction(patientId, consultationId, days ? parseInt(days) : undefined, cid, observation);
        } else if (type === 'exam_request') {
            if (!examList.trim()) { alert('Preencha a lista de exames'); setLoading(false); return; }
            res = await generateExamRequestAction(patientId, consultationId, examList, justification);
        } else {
            if (!content.trim()) { alert('Preencha o conteúdo do laudo'); setLoading(false); return; }
            res = await generateReportAction(patientId, consultationId, content);
        }

        setLoading(false);

        if (res.success && res.pdfBase64) {
            const link = document.createElement('a');
            link.href = `data:application/pdf;base64,${res.pdfBase64}`;
            link.download = `${type}-${patientName}-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            onClose();
        } else {
            alert(res.error || 'Erro ao gerar documento.');
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} style={{ maxWidth: '700px', width: '100%' }}>
                <div className={styles.header}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {type === 'prescription' && <FileText size={20} />}
                        {type === 'certificate' && <Activity size={20} />}
                        {type === 'report' && <Scroll size={20} />}
                        Novo Documento
                    </h3>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                </div>

                <div className={styles.body} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Type Selector (Tabs) */}
                    <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                        {[
                            { id: 'prescription', label: 'Receita', icon: FileText },
                            { id: 'certificate', label: 'Atestado', icon: Activity },
                            { id: 'exam_request', label: 'Exames', icon: ClipboardList },
                            { id: 'report', label: 'Laudo', icon: Scroll }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setType(t.id as DocumentType)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderBottom: type === t.id ? '2px solid var(--primary)' : '2px solid transparent',
                                    color: type === t.id ? 'var(--primary)' : 'var(--text-muted)',
                                    fontWeight: type === t.id ? 600 : 400,
                                    background: 'none',
                                    borderTop: 'none',
                                    borderLeft: 'none',
                                    borderRight: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <t.icon size={16} />
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Prescription Form */}
                    {type === 'prescription' && (
                        <>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Medicamentos</label>
                                <textarea
                                    value={medications}
                                    onChange={e => setMedications(e.target.value)}
                                    placeholder="Ex: Amoxicilina 875mg 1 cp 12/12h..."
                                    style={{ width: '100%', height: '150px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Instruções (Opcional)</label>
                                <textarea
                                    value={instructions}
                                    onChange={e => setInstructions(e.target.value)}
                                    style={{ width: '100%', height: '80px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                                />
                            </div>
                        </>
                    )}

                    {/* Certificate Form */}
                    {type === 'certificate' && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Dias de Afastamento</label>
                                    <input
                                        type="number"
                                        value={days}
                                        onChange={e => setDays(e.target.value)}
                                        placeholder="Ex: 3"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                                    />
                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>Deixe em branco para &quot;Declaração de Comparecimento&quot;</span>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>CID (Opcional)</label>
                                    <input
                                        type="text"
                                        value={cid}
                                        onChange={e => setCid(e.target.value)}
                                        placeholder="Ex: J00"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Observações</label>
                                <textarea
                                    value={observation}
                                    onChange={e => setObservation(e.target.value)}
                                    placeholder="Ex: Paciente esteve em consulta..."
                                    style={{ width: '100%', height: '100px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                                />
                            </div>
                        </>
                    )}

                    {/* Exam Request Form */}
                    {type === 'exam_request' && (
                        <>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Exames Solicitados</label>
                                <textarea
                                    value={examList}
                                    onChange={e => setExamList(e.target.value)}
                                    placeholder="Ex: Hemograma completo\nCreatinina\nUrina I..."
                                    style={{ width: '100%', height: '150px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Justificativa / Indicação Clínica</label>
                                <textarea
                                    value={justification}
                                    onChange={e => setJustification(e.target.value)}
                                    placeholder="Ex: Suspeita clínica de infecção..."
                                    style={{ width: '100%', height: '80px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                                />
                            </div>
                        </>
                    )}

                    {/* Report Form */}
                    {type === 'report' && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Conteúdo do Laudo</label>
                            <textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="Descreva o quadro clínico detalhado..."
                                style={{ width: '100%', height: '300px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                            />
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <button onClick={onClose} className={styles.secondaryBtn} disabled={loading}>
                        Cancelar
                    </button>
                    <button
                        onClick={handleGenerate}
                        className={styles.primaryBtn}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                        Gerar PDF
                    </button>
                </div>
            </div>
        </div>
    );
}
