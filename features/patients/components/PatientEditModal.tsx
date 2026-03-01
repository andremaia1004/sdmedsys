'use client';

import React, { useState, useEffect } from 'react';
import { Patient, PatientInput } from '../types';
import { updatePatientAction } from '../actions';
import { X, Save, Loader2, User, Phone, Info } from 'lucide-react';
import modalStyles from '@/components/ui/Modal.module.css';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';

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
    const { showToast } = useToast();

    useEffect(() => {
        if (isOpen && patient) {
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
            if (section === 'identification') {
                if (!formData.name?.trim()) { showToast('error', 'Nome é obrigatório'); setIsLoading(false); return; }
                if (!formData.document?.trim()) { showToast('error', 'CPF é obrigatório'); setIsLoading(false); return; }
            }

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
                doctor_id: patient.doctor_id,
            };

            const res = await updatePatientAction(patient.id, input);

            if (res.success && res.data) {
                showToast('success', 'Dados atualizados com sucesso!');
                onSuccess(res.data);
                onClose();
            } else {
                showToast('error', res.error || 'Erro ao atualizar paciente.');
            }
        } catch (error) {
            console.error(error);
            showToast('error', 'Erro desconhecido ao salvar.');
        } finally {
            setIsLoading(false);
        }
    };

    const getTitle = () => {
        switch (section) {
            case 'identification': return 'Identificação do Paciente';
            case 'contact': return 'Contato e Localização';
            case 'additional': return 'Informações Complementares';
            default: return 'Editar Dados';
        }
    };

    const getIcon = () => {
        switch (section) {
            case 'identification': return <User size={20} />;
            case 'contact': return <Phone size={20} />;
            case 'additional': return <Info size={20} />;
            default: return null;
        }
    };

    const renderFields = () => {
        switch (section) {
            case 'identification':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <Input
                            label="Nome Completo *"
                            value={formData.name || ''}
                            onChange={e => handleChange('name', e.target.value)}
                            fullWidth
                            placeholder="Nome Completo"
                        />
                        <Input
                            label="Documento (CPF / RG) *"
                            value={formData.document || ''}
                            onChange={e => handleChange('document', e.target.value)}
                            fullWidth
                            placeholder="000.000.000-00"
                        />
                        <Input
                            label="Data de Nascimento"
                            type="date"
                            value={formData.birth_date || ''}
                            onChange={e => handleChange('birth_date', e.target.value)}
                            fullWidth
                        />
                    </div>
                );
            case 'contact':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <Input
                            label="Telefone / Celular"
                            value={formData.phone || ''}
                            onChange={e => handleChange('phone', e.target.value)}
                            fullWidth
                            placeholder="(00) 00000-0000"
                        />
                        <Input
                            label="E-mail"
                            type="email"
                            value={formData.email || ''}
                            onChange={e => handleChange('email', e.target.value)}
                            fullWidth
                            placeholder="exemplo@email.com"
                        />
                        <Textarea
                            label="Endereço Completo"
                            value={formData.address || ''}
                            onChange={e => handleChange('address', e.target.value)}
                            fullWidth
                            placeholder="Rua, número, bairro, cidade..."
                            rows={3}
                        />
                    </div>
                );
            case 'additional':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <Input
                            label="Convênio / Plano"
                            value={formData.insurance || ''}
                            onChange={e => handleChange('insurance', e.target.value)}
                            fullWidth
                            placeholder="Ex: Unimed, Bradesco, Particular"
                        />
                        <Input
                            label="Responsável Legal"
                            value={formData.guardian_name || ''}
                            onChange={e => handleChange('guardian_name', e.target.value)}
                            fullWidth
                            placeholder="Nome do pai, mãe ou responsável"
                        />
                        <Input
                            label="Contato de Emergência"
                            value={formData.emergency_contact || ''}
                            onChange={e => handleChange('emergency_contact', e.target.value)}
                            fullWidth
                            placeholder="Nome e Telefone"
                        />
                        <Textarea
                            label="Queixa Principal / Observação de Cadastro"
                            value={formData.main_complaint || ''}
                            onChange={e => handleChange('main_complaint', e.target.value)}
                            fullWidth
                            placeholder="Digite aqui as observações iniciais..."
                            rows={3}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className={modalStyles.overlay}>
            <div className={modalStyles.modal} style={{ maxWidth: '550px', borderRadius: '16px' }}>
                <div className={modalStyles.header} style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)' }}>
                        {getIcon()}
                        <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>{getTitle()}</h3>
                    </div>
                    <button onClick={onClose} className={modalStyles.closeBtn}><X size={20} /></button>
                </div>
                <div className={modalStyles.body} style={{ padding: '2rem' }}>
                    {renderFields()}
                </div>
                <div className={modalStyles.footer} style={{ background: '#f8fafc', padding: '1.25rem 2rem', gap: '1rem' }}>
                    <Button variant="secondary" onClick={onClose} disabled={isLoading} style={{ borderRadius: '10px' }}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={isLoading}
                        style={{
                            borderRadius: '10px',
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            background: 'var(--primary)',
                            padding: '0.75rem 2rem',
                            fontWeight: 700
                        }}
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Salvar Alterações
                    </Button>
                </div>
            </div>
        </div>
    );
}

