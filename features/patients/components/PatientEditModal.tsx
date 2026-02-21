'use client';

import React, { useState, useEffect } from 'react';
import { Patient, PatientInput } from '../types';
import { updatePatientAction } from '../actions';
import { X, Save, Loader2 } from 'lucide-react';
import styles from '@/components/ui/Modal.module.css';
import { useToastSuccess, useToastError } from '@/components/ui/Toast';

export type EditSection = 'identification' | 'contact' | 'additional';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient;
    section: EditSection;
    onSuccess: (updatedPatient: Patient) => void;
}

export function PatientEditModal({ isOpen, onClose, patient, section, onSuccess }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<PatientInput>>({});
    const toastSuccess = useToastSuccess();
    const toastError = useToastError();

    useEffect(() => {
        if (isOpen && patient) {
            // Initialize form data based on patient data
            setFormData({
                name: patient.name,
                document: patient.document,
                birth_date: patient.birth_date ? new Date(patient.birth_date).toISOString().split('T')[0] : '',
                phone: patient.phone || '',
                email: patient.email || '',
                address: patient.address || '',
                insurance: patient.insurance || '',
                guardian_name: patient.guardian_name || '',
                emergency_contact: patient.emergency_contact || '',
                main_complaint: patient.main_complaint || '',
            });
        }
    }, [isOpen, patient]);

    if (!isOpen) return null;

    const handleChange = (field: keyof PatientInput, value: string) => {
        setFormData((prev: Partial<PatientInput>) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            // Basic Validation
            if (section === 'identification') {
                if (!formData.name?.trim()) { toastError('Nome é obrigatório'); setIsLoading(false); return; }
                if (!formData.document?.trim()) { toastError('CPF é obrigatório'); setIsLoading(false); return; }
            }

            // Prepare input
            const input: PatientInput = {
                name: formData.name || patient.name,
                document: formData.document || patient.document,
                phone: formData.phone !== undefined ? (formData.phone || null) : patient.phone,
                birth_date: formData.birth_date !== undefined ? (formData.birth_date || null) : patient.birth_date,
                email: formData.email !== undefined ? (formData.email || null) : patient.email,
                address: formData.address !== undefined ? (formData.address || null) : patient.address,
                insurance: formData.insurance !== undefined ? (formData.insurance || null) : patient.insurance,
                guardian_name: formData.guardian_name !== undefined ? (formData.guardian_name || null) : patient.guardian_name,
                emergency_contact: formData.emergency_contact !== undefined ? (formData.emergency_contact || null) : patient.emergency_contact,
                main_complaint: formData.main_complaint !== undefined ? (formData.main_complaint || null) : patient.main_complaint,
            };

            const res = await updatePatientAction(patient.id, input);

            if (res.success && res.data) {
                toastSuccess('Dados atualizados com sucesso!');
                onSuccess(res.data);
                onClose();
            } else {
                toastError(res.error || 'Erro ao atualizar paciente.');
            }
        } catch (error) {
            console.error(error);
            toastError('Erro desconhecido ao salvar.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderFields = () => {
        switch (section) {
            case 'identification':
                return (
                    <>
                        <div className={styles.formGroup}>
                            <label>Nome Completo *</label>
                            <input
                                type="text"
                                value={formData.name || ''}
                                onChange={e => handleChange('name', e.target.value)}
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>CPF *</label>
                            <input
                                type="text"
                                value={formData.document || ''}
                                onChange={e => handleChange('document', e.target.value)}
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Data de Nascimento</label>
                            <input
                                type="date"
                                value={formData.birth_date || ''}
                                onChange={e => handleChange('birth_date', e.target.value)}
                                className={styles.input}
                            />
                        </div>
                    </>
                );
            case 'contact':
                return (
                    <>
                        <div className={styles.formGroup}>
                            <label>Telefone</label>
                            <input
                                type="text"
                                value={formData.phone || ''}
                                onChange={e => handleChange('phone', e.target.value)}
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>E-mail</label>
                            <input
                                type="email"
                                value={formData.email || ''}
                                onChange={e => handleChange('email', e.target.value)}
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Endereço</label>
                            <textarea
                                value={formData.address || ''}
                                onChange={e => handleChange('address', e.target.value)}
                                className={styles.textarea}
                                rows={3}
                            />
                        </div>
                    </>
                );
            case 'additional':
                return (
                    <>
                        <div className={styles.formGroup}>
                            <label>Convênio / Plano</label>
                            <input
                                type="text"
                                value={formData.insurance || ''}
                                onChange={e => handleChange('insurance', e.target.value)}
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Responsável</label>
                            <input
                                type="text"
                                value={formData.guardian_name || ''}
                                onChange={e => handleChange('guardian_name', e.target.value)}
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Contato de Emergência</label>
                            <input
                                type="text"
                                value={formData.emergency_contact || ''}
                                onChange={e => handleChange('emergency_contact', e.target.value)}
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Queixa Principal (Cadastro)</label>
                            <textarea
                                value={formData.main_complaint || ''}
                                onChange={e => handleChange('main_complaint', e.target.value)}
                                className={styles.textarea}
                                rows={3}
                            />
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3>Editar {section === 'identification' ? 'Identificação' : section === 'contact' ? 'Contato' : 'Informações Adicionais'}</h3>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                </div>
                <div className={styles.body}>
                    {renderFields()}
                </div>
                <div className={styles.footer}>
                    <button onClick={onClose} className={styles.secondaryBtn} disabled={isLoading}>Cancelar</button>
                    <button onClick={handleSave} className={styles.primaryBtn} disabled={isLoading} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
}
