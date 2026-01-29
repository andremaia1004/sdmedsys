'use client';

import { useState } from 'react';
import { Consultation } from '@/features/consultation/types';
import { updateClinicalNotesAction, finishConsultationAction } from '../actions';

export default function ConsultationWorkspace({ consultation, patientName }: { consultation: Consultation, patientName: string }) {
    const [notes, setNotes] = useState(consultation.clinicalNotes);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await updateClinicalNotesAction(consultation.id, notes);
        setSaving(false);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>Patient: {patientName}</h1>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>
                    Started at: {new Date(consultation.startedAt).toLocaleTimeString()}
                </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Clinical Notes</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={handleSave} // Auto-save on blur
                    placeholder="Type clinical notes here..."
                    style={{ width: '100%', minHeight: '300px', padding: '1rem', fontSize: '1rem', lineHeight: '1.5', borderRadius: '8px', border: '1px solid #ccc' }}
                />
                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>
                    {saving ? 'Saving...' : 'All changes saved'}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <form action={async () => {
                    await handleSave(); // Ensure latest saved
                    await finishConsultationAction(consultation.id);
                }}>
                    <button
                        type="submit"
                        style={{ padding: '1rem 2rem', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer' }}
                        onClick={(e) => {
                            if (!confirm('Finish consultation? This cannot be undone.')) e.preventDefault();
                        }}
                    >
                        Finish Consultation
                    </button>
                </form>
            </div>
        </div>
    );
}
