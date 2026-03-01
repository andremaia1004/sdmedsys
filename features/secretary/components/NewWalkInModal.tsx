'use client';

import React, { useState, useEffect } from 'react';
import { createWalkInAction } from '@/features/secretary/actions';
import { searchPatientsAction } from '@/features/patients/actions';
import { listDoctorsAction } from '@/features/doctors/actions';
import { Patient } from '@/features/patients/types';
import { Doctor } from '@/features/doctors/types';
import styles from '@/features/secretary/styles/Dashboard.module.css';
import { useToast } from '@/components/ui/Toast';
import PatientForm from '@/features/patients/components/PatientForm';
import { UserPlus, ArrowLeft } from 'lucide-react';

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
    const [startDate, setStartDate] = useState<string>('');
    const [startTime, setStartTime] = useState<string>('');
    const [showPatientForm, setShowPatientForm] = useState(false);

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

    const handlePatientCreated = (newPatient: Patient) => {
        setSelectedPatient(newPatient);
        setShowPatientForm(false);
        setPatientQuery(newPatient.name);
    };

    const handleCreate = async () => {
        if (!selectedPatient || !selectedDoctorId) return;
        setLoading(true);
        const result = await createWalkInAction(selectedPatient.id, selectedDoctorId, priority, startDate ? startDate : undefined, startTime ? startTime : undefined);
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label style={{ margin: 0 }}>{showPatientForm ? 'Novo Cadastro de Paciente' : 'Buscar Paciente:'}</label>
                        {!selectedPatient && (
                            <button
                                type="button"
                                onClick={() => setShowPatientForm(!showPatientForm)}
                                style={{
                                    border: 'none',
                                    background: 'none',
                                    color: 'var(--primary)',
                                    fontSize: '0.875rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem'
                                }}
                            >
                                {showPatientForm ? (
                                    <><ArrowLeft size={16} /> Voltar para busca</>
                                ) : (
                                    <><UserPlus size={16} /> Novo Paciente</>
                                )}
                            </button>
                        )}
                    </div>

                    {showPatientForm ? (
                        <div style={{
                            background: '#f8fafc',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            maxHeight: '400px',
                            overflowY: 'auto',
                            animation: 'fadeIn 0.2s ease-out'
                        }}>
                            <PatientForm onSuccess={handlePatientCreated} />
                        </div>
                    ) : (
                        <>
                            <input
                                type="text"
                                value={patientQuery}
                                onChange={handleSearch}
                                placeholder="Nome ou CPF..."
                                className={styles.search}
                                style={{ width: '100%' }}
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
                        </>
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

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', marginTop: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label>Data (opcional):</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={styles.search}
                            style={{ width: '100%', marginTop: '0.5rem' }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label>Hora (opcional):</label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className={styles.search}
                            style={{ width: '100%', marginTop: '0.5rem' }}
                        />
                    </div>
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
