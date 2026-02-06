'use client';

import { useActionState, useEffect, useState } from 'react';
import { createPatientAction } from '../actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import styles from '../styles/Patients.module.css';

export default function PatientForm({ onSuccess }: { onSuccess?: () => void }) {
    // @ts-ignore
    const [state, formAction, isPending] = useActionState(createPatientAction, { error: '' });

    // Wizard State
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        document: '',
        birthDate: '',
        guardian_name: '',
        phone: '',
        email: '',
        address: '',
        insurance: '',
        emergency_contact: '',
        main_complaint: ''
    });

    useEffect(() => {
        if (state?.success && onSuccess) {
            onSuccess();
        }
    }, [state?.success, onSuccess]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateStep = (step: number) => {
        if (step === 1) {
            if (!formData.name || !formData.document || !formData.birthDate) {
                alert('Por favor, preencha os campos obrigatórios (Nome, Documento e Data de Nascimento).');
                return false;
            }
        }
        // Step 2 and 3 can be optional depending on strictness, but let's enforce Phone for Contact
        if (step === 2) {
            if (!formData.phone) {
                alert('Por favor, informe ao menos um telefone de contato.');
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
    };

    // Render helper for Steps
    const renderStepIndicator = () => (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', gap: '1rem' }}>
            {[1, 2, 3].map(step => (
                <div key={step} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    opacity: currentStep === step ? 1 : 0.5,
                    fontWeight: currentStep === step ? 'bold' : 'normal',
                    color: currentStep === step ? 'var(--primary)' : '#999'
                }}>
                    <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: currentStep === step ? 'var(--primary)' : '#eee',
                        color: currentStep === step ? '#fff' : '#666',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.875rem'
                    }}>
                        {step}
                    </div>
                    <span>
                        {step === 1 && 'Dados Pessoais'}
                        {step === 2 && 'Contato'}
                        {step === 3 && 'Clínico'}
                    </span>
                </div>
            ))}
        </div>
    );

    return (
        <div className={styles.formContainer}>
            {renderStepIndicator()}

            <form action={formAction}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* STEP 1: DADOS PESSOAIS */}
                    {currentStep === 1 && (
                        <div className="animate-fade-in">
                            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '1.5rem', borderBottom: '2px solid #f0f0f0', paddingBottom: '0.5rem' }}>
                                1. Dados Pessoais
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <Input label="Nome Completo *" name="name" value={formData.name} onChange={handleChange} placeholder="Ex: João Silva" fullWidth required />
                                <Input label="Documento (CPF / RG) *" name="document" value={formData.document} onChange={handleChange} placeholder="000.000.000-00" fullWidth required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                                <Input label="Data de Nascimento *" name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} fullWidth required />
                                <Input label="Nome do Responsável" name="guardian_name" value={formData.guardian_name} onChange={handleChange} placeholder="Mãe, Pai ou Responsável" fullWidth />
                            </div>
                        </div>
                    )}

                    {/* STEP 2: CONTATO E ENDEREÇO */}
                    {currentStep === 2 && (
                        <div className="animate-fade-in">
                            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '1.5rem', borderBottom: '2px solid #f0f0f0', paddingBottom: '0.5rem' }}>
                                2. Contato e Endereço
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <Input label="Telefone / WhatsApp *" name="phone" value={formData.phone} onChange={handleChange} placeholder="(00) 00000-0000" fullWidth required />
                                <Input label="E-mail" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="exemplo@email.com" fullWidth />
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <Input label="Endereço Completo" name="address" value={formData.address} onChange={handleChange} placeholder="Rua, Número, Bairro, Cidade - UF" fullWidth />
                            </div>
                        </div>
                    )}

                    {/* STEP 3: DADOS CLÍNICOS E FINANCEIROS */}
                    {currentStep === 3 && (
                        <div className="animate-fade-in">
                            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '1.5rem', borderBottom: '2px solid #f0f0f0', paddingBottom: '0.5rem' }}>
                                3. Dados Clínicos e Financeiros
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <Input label="Convênio / Pagamento" name="insurance" value={formData.insurance} onChange={handleChange} placeholder="Ex: Unimed, Particular, etc." fullWidth />
                                <Input label="Contato de Emergência" name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} placeholder="Nome e Telefone" fullWidth />
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <Textarea label="Queixa Principal / Motivo" name="main_complaint" value={formData.main_complaint} onChange={handleChange} placeholder="Motivo do cadastro ou queixa inicial" fullWidth />
                            </div>
                        </div>
                    )}

                    {/* HIDDEN INPUTS FOR PERSISTENCE across steps */}
                    {Object.entries(formData).map(([key, value]) => {
                        // Only render hidden input if the field is NOT in the current step logic
                        // Actually, easier: Render hidden for ALL, but disable the ones that are currently visible to avoid duplicates?
                        // Or just use the fact that if a visible input has the same name, it might conflict.
                        // STRATEGY: Only render hidden inputs for fields NOT present in the current step.

                        const step1Fields = ['name', 'document', 'birthDate', 'guardian_name'];
                        const step2Fields = ['phone', 'email', 'address'];
                        const step3Fields = ['insurance', 'emergency_contact', 'main_complaint'];

                        let isVisible = false;
                        if (currentStep === 1 && step1Fields.includes(key)) isVisible = true;
                        if (currentStep === 2 && step2Fields.includes(key)) isVisible = true;
                        if (currentStep === 3 && step3Fields.includes(key)) isVisible = true;

                        if (!isVisible) {
                            return <input key={key} type="hidden" name={key} value={value} />;
                        }
                        return null;
                    })}

                    {/* NAVIGATION BUTTONS */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                        {currentStep > 1 ? (
                            <Button type="button" variant="secondary" onClick={handleBack}>
                                Voltar
                            </Button>
                        ) : <div />} {/* Spacer */}

                        {currentStep < 3 ? (
                            <Button type="button" variant="primary" onClick={handleNext}>
                                Próximo &gt;
                            </Button>
                        ) : (
                            <Button type="submit" variant="primary" disabled={isPending} style={{ paddingLeft: '2rem', paddingRight: '2rem', backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}>
                                {isPending ? 'Finalizando...' : 'Concluir Cadastro'}
                            </Button>
                        )}
                    </div>

                    {state?.error && (
                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            marginTop: '1rem',
                            border: '1px solid #fecaca',
                            textAlign: 'center'
                        }}>
                            {state.error}
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}


