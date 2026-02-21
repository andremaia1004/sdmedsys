import React, { useState, useEffect } from 'react';
import { CrmCard } from '../types';
import modalStyles from '@/components/ui/Modal.module.css';
import { X, Save, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
    card: CrmCard | null;
    onClose: () => void;
    onSave: (id: string, notes: string) => Promise<void>;
}

export function CrmCardEditModal({ card, onClose, onSave }: Props) {
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (card) {
            setNotes(card.notes || '');
        }
    }, [card]);

    if (!card) return null;

    const handleSave = async () => {
        setLoading(true);
        await onSave(card.id, notes);
        setLoading(false);
        onClose();
    };

    return (
        <div className={modalStyles.overlay}>
            <div className={modalStyles.modal} style={{ maxWidth: '500px', width: '100%' }}>
                <div className={modalStyles.header}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <FileText size={18} />
                        Editar Lead / Paciente
                    </h3>
                    <button onClick={onClose} className={modalStyles.closeBtn}><X size={20} /></button>
                </div>

                <div className={modalStyles.body}>
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <strong style={{ display: 'block', fontSize: '1.1rem', color: '#0f172a' }}>{card.patient_name}</strong>
                        {card.patient_phone && <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{card.patient_phone}</span>}
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Observações do CRM</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Adicione histórico de contatos, lembretes..."
                            style={{ width: '100%', height: '150px', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical', fontSize: '0.95rem' }}
                        />
                    </div>
                </div>

                <div className={modalStyles.footer} style={{ marginTop: '1.5rem' }}>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSave} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {loading ? 'Salvando...' : <><Save size={16} /> Salvar</>}
                    </Button>
                </div>
            </div>
        </div>
    );
}
