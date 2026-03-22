'use client';

import { useState } from 'react';
import type {
    CreateTransactionInput,
    IncomeCategory,
    PaymentMethod,
    FinancialService,
} from '../types';
import {
    INCOME_CATEGORY_LABELS,
    PAYMENT_METHOD_LABELS,
} from '../types';
import styles from './Financial.module.css';

interface IncomeFormProps {
    services: FinancialService[];
    consultationId?: string;
    patientId?: string;
    patientName?: string;
    onSubmit: (input: CreateTransactionInput) => Promise<void>;
    loading: boolean;
}

const INCOME_CATEGORIES = Object.keys(INCOME_CATEGORY_LABELS) as IncomeCategory[];
const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];

export default function IncomeForm({
    services,
    consultationId,
    patientId,
    patientName,
    onSubmit,
    loading,
}: IncomeFormProps) {
    const today = new Date().toISOString().split('T')[0];

    const [serviceId, setServiceId] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<IncomeCategory>('CONSULTATION');
    const [method, setMethod] = useState<PaymentMethod>('PIX');
    const [competencyDate, setCompetencyDate] = useState(today);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    function handleServiceChange(id: string) {
        setServiceId(id);
        const svc = services.find(s => s.id === id);
        if (svc) {
            setDescription(svc.name);
            setAmount(svc.default_price.toFixed(2));
            setCategory(svc.category === 'OTHER' ? 'OTHER_INCOME' : svc.category as IncomeCategory);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        const parsedAmount = parseFloat(amount);
        if (!description.trim()) { setError('Descrição é obrigatória.'); return; }
        if (isNaN(parsedAmount) || parsedAmount <= 0) { setError('Valor inválido.'); return; }

        await onSubmit({
            type: 'INCOME',
            category,
            description: description.trim(),
            amount: parsedAmount,
            payment_method: method,
            status: 'PAID',
            competency_date: competencyDate,
            consultation_id: consultationId,
            patient_id: patientId,
            financial_service_id: serviceId || undefined,
            notes: notes.trim() || undefined,
        });
    }

    return (
        <form id="income-form" className={styles.form} onSubmit={handleSubmit}>
            {patientName && (
                <div className={styles.formGroup}>
                    <label>Paciente</label>
                    <input value={patientName} readOnly disabled />
                </div>
            )}

            <div className={styles.formGroup}>
                <label>Serviço (catálogo)</label>
                <select value={serviceId} onChange={e => handleServiceChange(e.target.value)}>
                    <option value="">— Selecione ou preencha manualmente —</option>
                    {services.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.name} — R$ {s.default_price.toFixed(2)}
                        </option>
                    ))}
                </select>
            </div>

            <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <label>Categoria *</label>
                    <select value={category} onChange={e => setCategory(e.target.value as IncomeCategory)} required>
                        {INCOME_CATEGORIES.map(c => (
                            <option key={c} value={c}>{INCOME_CATEGORY_LABELS[c]}</option>
                        ))}
                    </select>
                </div>
                <div className={styles.formGroup}>
                    <label>Forma de pagamento *</label>
                    <select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)} required>
                        {PAYMENT_METHODS.map(m => (
                            <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.formGroup}>
                <label>Descrição *</label>
                <input
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Ex: Consulta Clínica Geral"
                    required
                />
            </div>

            <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <label>Valor (R$) *</label>
                    <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0,00"
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Data de competência *</label>
                    <input
                        type="date"
                        value={competencyDate}
                        onChange={e => setCompetencyDate(e.target.value)}
                        required
                    />
                </div>
            </div>

            <div className={styles.formGroup}>
                <label>Observações</label>
                <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Observações opcionais..."
                />
            </div>

            {error && <div className={styles.errorMsg}>{error}</div>}
        </form>
    );
}
