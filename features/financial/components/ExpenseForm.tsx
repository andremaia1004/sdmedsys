'use client';

import { useState } from 'react';
import type { CreateTransactionInput, ExpenseCategory } from '../types';
import { EXPENSE_CATEGORY_LABELS } from '../types';
import styles from './Financial.module.css';

interface ExpenseFormProps {
    onSubmit: (input: CreateTransactionInput) => Promise<void>;
    loading: boolean;
}

const EXPENSE_CATEGORIES = Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[];

export default function ExpenseForm({ onSubmit, loading }: ExpenseFormProps) {
    const today = new Date().toISOString().split('T')[0];

    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<ExpenseCategory>('OTHER_EXPENSE');
    const [competencyDate, setCompetencyDate] = useState(today);
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        const parsedAmount = parseFloat(amount);
        if (!description.trim()) { setError('Descrição é obrigatória.'); return; }
        if (isNaN(parsedAmount) || parsedAmount <= 0) { setError('Valor inválido.'); return; }

        await onSubmit({
            type: 'EXPENSE',
            category,
            description: description.trim(),
            amount: parsedAmount,
            status: 'PAID',
            competency_date: competencyDate,
            due_date: dueDate || undefined,
            notes: notes.trim() || undefined,
        });
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit} id="expense-form">
            <div className={styles.formGroup}>
                <label>Descrição *</label>
                <input
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Ex: Aluguel do consultório"
                    required
                />
            </div>

            <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <label>Categoria *</label>
                    <select value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)} required>
                        {EXPENSE_CATEGORIES.map(c => (
                            <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c]}</option>
                        ))}
                    </select>
                </div>
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
            </div>

            <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <label>Data de competência *</label>
                    <input
                        type="date"
                        value={competencyDate}
                        onChange={e => setCompetencyDate(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Vencimento</label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
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
