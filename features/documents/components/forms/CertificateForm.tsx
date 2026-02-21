'use client';

import React, { useState } from 'react';
import { generateCertificateAction } from '@/features/documents/actions';
import { Loader2, Download } from 'lucide-react';
import styles from '@/components/ui/Modal.module.css';
import { useToast } from '@/components/ui/Toast';

interface Props {
    patientId: string;
    consultationId: string | null;
    patientName: string;
    onCancel: () => void;
    onSuccess: () => void;
}

export function CertificateForm({ patientId, consultationId, patientName, onCancel, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [days, setDays] = useState<string>('');
    const [cid, setCid] = useState('');
    const [observation, setObservation] = useState('');
    const { showToast } = useToast();

    const handleGenerate = async () => {
        setLoading(true);
        const res = await generateCertificateAction(patientId, consultationId, days ? parseInt(days) : undefined, cid, observation);
        setLoading(false);

        if (res.success && res.data) {
            const link = document.createElement('a');
            link.href = `data:application/pdf;base64,${res.data}`;
            link.download = `certificate-${patientName}-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast('success', 'Documento gerado com sucesso!');
            onSuccess();
        } else {
            showToast('error', res.error || 'Erro ao gerar documento.');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Dias de Afastamento</label>
                        <input
                            type="number"
                            value={days}
                            onChange={e => setDays(e.target.value)}
                            placeholder="Ex: 3"
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                        />
                        <span style={{ fontSize: '0.8rem', color: '#666' }}>Deixe em branco para "Declaração de Comparecimento"</span>
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
            </div>

            <div className={styles.footer} style={{ marginTop: '1.5rem', padding: '1.5rem 0 0 0', borderTop: '1px solid #e2e8f0' }}>
                <button onClick={onCancel} className={styles.secondaryBtn} disabled={loading}>
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
    );
}
