'use client';

import { useActionState } from 'react';
import { createPatientAction } from '../actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import styles from '../styles/Patients.module.css';

export default function PatientForm() {
    // @ts-ignore
    const [state, formAction, isPending] = useActionState(createPatientAction, { error: '' });

    return (
        <div className={styles.formContainer}>
            <form action={formAction}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    <h3 style={{ fontSize: '1rem', color: '#666', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Dados Pessoais</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input
                            label="Nome Completo"
                            name="name"
                            placeholder="Ex: João Silva"
                            required
                            fullWidth
                        />
                        <Input
                            label="Documento (CPF / RG)"
                            name="document"
                            placeholder="000.000.000-00"
                            required
                            fullWidth
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input
                            label="Data de Nascimento"
                            name="birthDate"
                            type="date"
                            required
                            fullWidth
                        />
                        <Input
                            label="Nome do Responsável (se aplicável)"
                            name="guardian_name"
                            placeholder="Mãe, Pai ou Responsável"
                            fullWidth
                        />
                    </div>

                    <h3 style={{ fontSize: '1rem', color: '#666', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '1rem' }}>Contato e Endereço</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input
                            label="Telefone / WhatsApp"
                            name="phone"
                            placeholder="(00) 00000-0000"
                            fullWidth
                        />
                        <Input
                            label="E-mail"
                            name="email"
                            type="email"
                            placeholder="exemplo@email.com"
                            fullWidth
                        />
                    </div>
                    <Input
                        label="Endereço Completo"
                        name="address"
                        placeholder="Rua, Número, Bairro, Cidade - UF"
                        fullWidth
                    />

                    <h3 style={{ fontSize: '1rem', color: '#666', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '1rem' }}>Dados Clínicos e Financeiros</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input
                            label="Convênio / Pagamento"
                            name="insurance"
                            placeholder="Ex: Unimed, Particular, etc."
                            fullWidth
                        />
                        <Input
                            label="Contato de Emergência"
                            name="emergency_contact"
                            placeholder="Nome e Telefone"
                            fullWidth
                        />
                    </div>

                    <Textarea
                        label="Queixa Principal / Motivo"
                        name="main_complaint"
                        placeholder="Motivo do cadastro ou queixa inicial"
                        fullWidth
                    />

                    <div style={{ marginTop: '1rem' }}>
                        <Button
                            type="submit"
                            disabled={isPending}
                            variant="primary"
                            fullWidth
                        >
                            {isPending ? 'Cadastrando...' : 'Cadastrar Paciente'}
                        </Button>
                    </div>

                    {state?.error && (
                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            marginTop: '1rem',
                            border: '1px solid #fecaca'
                        }}>
                            {state.error}
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}
