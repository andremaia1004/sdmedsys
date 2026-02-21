'use client';

import { useActionState, useEffect, useState } from 'react';
import { createPatientAction } from '../actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Patient } from '../types';
import styles from '../styles/Patients.module.css';

export default function PatientForm({ onSuccess }: { onSuccess?: (patient: Patient) => void }) {
    const [state, formAction, isPending] = useActionState(createPatientAction, { error: '' });

    // Wizard State
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        document: '',
        birth_date: '',
        guardian_name: '',
        phone: '',
        email: '',
        // Address parts
        address_zip: '',
        address_street: '',
        address_number: '',
        address_neighborhood: '',
        address_city: '',
        // Clinical
        insurance: '',
        emergency_contact: '',
        main_complaint: ''
    });

    // Safety state to prevent double-click "Next" -> "Finish" race condition
    const [isSubmissionReady, setIsSubmissionReady] = useState(false);

    // Reverted: useEffect for step 3 delay moved to handleNext to avoid set-state-in-effect warning

    useEffect(() => {
        if (state?.success && state?.patient) {
            if (onSuccess) onSuccess(state.patient);
        }
    }, [state?.success, state?.patient, onSuccess]);

    // Reverted debug alert: This useEffect block was redundant and contained a debug alert.
    // The first useEffect block already handles the success state correctly by calling onSuccess.

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateStep = (step: number) => {
        if (step === 1) {
            if (!formData.name || !formData.document || !formData.birth_date) {
                alert('Por favor, preencha os campos obrigatórios (Nome, Documento e Data de Nascimento).');
                return false;
            }
        }
        if (step === 2) {
            if (!formData.phone) {
                alert('Por favor, informe ao menos um telefone de contato.');
                return false;
            }
            if (formData.address_street && (!formData.address_city || !formData.address_neighborhood)) {
                alert('Se preencher o endereço, informe ao menos a Rua, Bairro e Cidade.');
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);

            if (nextStep === 3) {
                setIsSubmissionReady(false);
                setTimeout(() => setIsSubmissionReady(true), 800);
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
    };

    // Helper to construct the full address for hidden input
    const fullAddress = [
        formData.address_street,
        formData.address_number ? `nº ${formData.address_number}` : '',
        formData.address_neighborhood ? `- ${formData.address_neighborhood}` : '',
        formData.address_city ? `- ${formData.address_city}` : '',
        formData.address_zip ? `(${formData.address_zip})` : ''
    ].filter(Boolean).join(' ');

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

            <form
                autoComplete="off"
                onClick={(e) => e.stopPropagation()}
                onSubmit={(e) => {
                    e.preventDefault(); // ALWAYS prevent default browser submission

                    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
                    const isFinishButton = submitter?.id === 'btn-finish-registration';

                    console.log('Submission Attempt:', {
                        submitterId: submitter?.id,
                        isFinishButton,
                        currentStep
                    });

                    // Only allow submission IF:
                    // 1. We are in Step 3 matches
                    // 2. The submitter is explicitly the "Finish" button
                    if (currentStep === 3 && isFinishButton) {
                        console.log('Valid submission allowed.');
                        const formData = new FormData(e.currentTarget);
                        formAction(formData);
                    } else {
                        console.warn('Submission BLOCKED: Implicit submit or wrong step detected.');
                        if (!isFinishButton) {
                            console.warn('Reason: Submitter was not the finish button (likely implicit Enter or browser autofill).');
                        }
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
                        e.preventDefault();
                    }
                }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* STEP 1: DADOS PESSOAIS */}
                    {currentStep === 1 && (
                        <div key="step1">
                            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '1.5rem', borderBottom: '2px solid #f0f0f0', paddingBottom: '0.5rem' }}>
                                1. Dados Pessoais
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <Input label="Nome Completo *" name="name" value={formData.name} onChange={handleChange} placeholder="Ex: João Silva" fullWidth required />
                                <Input label="Documento (CPF / RG) *" name="document" value={formData.document} onChange={handleChange} placeholder="000.000.000-00" fullWidth required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                                <Input label="Data de Nascimento *" name="birth_date" type="date" value={formData.birth_date} onChange={handleChange} fullWidth required />
                                <Input label="Nome do Responsável" name="guardian_name" value={formData.guardian_name} onChange={handleChange} placeholder="Mãe, Pai ou Responsável" fullWidth />
                            </div>
                        </div>
                    )}

                    {/* STEP 2: CONTATO E ENDEREÇO */}
                    {currentStep === 2 && (
                        <div key="step2">
                            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '1.5rem', borderBottom: '2px solid #f0f0f0', paddingBottom: '0.5rem' }}>
                                2. Contato e Endereço
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <Input label="Telefone / WhatsApp *" name="phone" value={formData.phone} onChange={handleChange} placeholder="(00) 00000-0000" fullWidth required />
                                <Input label="E-mail" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="exemplo@email.com" fullWidth />
                            </div>

                            <div style={{ marginTop: '1.5rem', borderTop: '1px dashed #eee', paddingTop: '1.5rem' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#666', textTransform: 'uppercase' }}>Endereço Residencial</h4>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <Input label="CEP" name="address_zip" value={formData.address_zip} onChange={handleChange} placeholder="00000-000" fullWidth />
                                    <Input label="Cidade / UF" name="address_city" value={formData.address_city} onChange={handleChange} placeholder="Ex: São Paulo - SP" fullWidth />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <Input label="Rua / Logradouro" name="address_street" value={formData.address_street} onChange={handleChange} placeholder="Ex: Av. Paulista" fullWidth />
                                    <Input label="Número" name="address_number" value={formData.address_number} onChange={handleChange} placeholder="123" fullWidth />
                                </div>

                                <div>
                                    <Input label="Bairro" name="address_neighborhood" value={formData.address_neighborhood} onChange={handleChange} placeholder="Ex: Bela Vista" fullWidth />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: DADOS CLÍNICOS E FINANCEIROS */}
                    {currentStep === 3 && (
                        <div key="step3">
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
                    {/* Ensure 'address' is sent as a concatenated string */}
                    <input type="hidden" name="address" value={fullAddress} />

                    {Object.entries(formData).map(([key, value]) => {
                        // Only render hidden input if the field is NOT in the current step logic
                        // Strategy: Render hidden for fields NOT present in the current step.

                        const step1Fields = ['name', 'document', 'birth_date', 'guardian_name'];
                        const step2Fields = ['phone', 'email', 'address_zip', 'address_street', 'address_number', 'address_neighborhood', 'address_city'];
                        const step3Fields = ['insurance', 'emergency_contact', 'main_complaint'];

                        // We also skip individual address parts because we send the combined 'address' field
                        const addressParts = ['address_zip', 'address_street', 'address_number', 'address_neighborhood', 'address_city'];
                        if (addressParts.includes(key)) return null;

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
                            <Button
                                id="btn-finish-registration"
                                type="submit"
                                variant="primary"
                                disabled={isPending || !isSubmissionReady}
                                style={{
                                    paddingLeft: '2rem',
                                    paddingRight: '2rem',
                                    backgroundColor: isSubmissionReady ? 'var(--success)' : '#ccc',
                                    borderColor: isSubmissionReady ? 'var(--success)' : '#ccc',
                                    cursor: isSubmissionReady ? 'pointer' : 'not-allowed'
                                }}
                            >
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


