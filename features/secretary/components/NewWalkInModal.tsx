'use client';

import React, { useState, useEffect } from 'react';
import { createWalkInAction } from '@/features/secretary/actions';
import { searchPatientsAction } from '@/features/patients/actions';
import { listDoctorsAction } from '@/features/doctors/actions';
import { Patient } from '@/features/patients/types';
import { Doctor } from '@/features/doctors/types';
import styles from '@/features/secretary/styles/Dashboard.module.css';
import { useToast } from '@/components/ui/Toast';

interface NewWalkInModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function NewWalkInModal({ onClose, onSuccess }: NewWalkInModalProps) {
    const [patientQuery, setPatientQuery] = useState('');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
    const [priority, setPriority] = useState<'NORMAL' | 'PRIORITY'>('NORMAL');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        const loadDoctors = async () => {
            const res = await listDoctorsAction(true);
            if (res.success && res.data) {
                setDoctors(res.data);
                if (res.data.length > 0) {
                    setSelectedDoctorId(res.data[0].id);
                }
            }
        };
        loadDoctors();
    }, []);

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setPatientQuery(query);
        if (query.length > 2) {
            const res = await searchPatientsAction(query);
            setPatients(res.data || []);
        } else {
            setPatients([]);
        }
    };

    const handleCreate = async () => {
        if (!selectedPatient || !selectedDoctorId) return;
        setLoading(true);
        const result = await createWalkInAction(selectedPatient.id, selectedDoctorId, priority);
        if (result.success) {
            onSuccess();
            onClose();
        } else {
            showToast('error', result.error || 'Falha ao registrar');
        }
        setLoading(false);
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h3>Registrar Novo Atendimento (Chegada)</h3>

                <div style={{ marginBottom: '1rem' }}>
                    <label>Buscar Paciente:</label>
                    <input
                        type="text"
                        value={patientQuery}
                        onChange={handleSearch}
                        placeholder="Nome ou CPF..."
                        className={styles.search}
                        style={{ width: '100%', marginTop: '0.5rem' }}
                    />
                    {patients.length > 0 && !selectedPatient && (
                        <div className={styles.searchResultList}>
                            {patients.map(p => (
                                <div key={p.id} onClick={() => setSelectedPatient(p)} className={styles.searchResultItem}>
                                    {p.name} ({p.document})
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {selectedPatient && (
                    <div className={styles.selectedPatient}>
                        <p>Paciente selecionado: <strong>{selectedPatient.name}</strong></p>
                        <button onClick={() => setSelectedPatient(null)} className={styles.changeBtn}>Alterar</button>
                    </div>
                )}

                <div style={{ marginBottom: '1rem', marginTop: '1rem' }}>
                    <label>Especialista:</label>
                    <select
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        className={styles.search}
                        style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}
                        disabled={doctors.length === 0}
                    >
                        {doctors.length === 0 ? (
                            <option value="">Carregando médicos...</option>
                        ) : (
                            doctors.map(d => (
                                <option key={d.id} value={d.id}>{d.name} {d.specialty ? `(${d.specialty})` : ''}</option>
                            ))
                        )}
                    </select>
                </div>

                <div style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
                    <label>Tipo de Atendimento:</label>
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500 }}>
                            <input
                                type="radio"
                                name="priority"
                                value="NORMAL"
                                checked={priority === 'NORMAL'}
                                onChange={() => setPriority('NORMAL')}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            Normal
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, color: '#dc2626' }}>
                            <input
                                type="radio"
                                name="priority"
                                value="PRIORITY"
                                checked={priority === 'PRIORITY'}
                                onChange={() => setPriority('PRIORITY')}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            ⭐ PRIORIDADE (PR)
                        </label>
                    </div>
                </div>

                <div className={styles.modalActions}>
                    <button onClick={onClose} className={styles.cancelBtn}>Cancelar</button>
                    <button
                        onClick={handleCreate}
                        disabled={!selectedPatient || !selectedDoctorId || loading}
                        className={styles.confirmBtn}
                    >
                        {loading ? 'Registrando...' : 'Adicionar à Fila'}
                    </button>
                </div>
            </div>
        </div>
    );
}
