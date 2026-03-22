'use client';

import { useState, useTransition } from 'react';
import { Plus, Pencil, PowerOff } from 'lucide-react';
import {
    createServiceAction,
    updateServiceAction,
    deactivateServiceAction,
} from '../actions';
import type {
    FinancialService,
    ServiceCategory,
    CreateServiceInput,
} from '../types';
import { SERVICE_CATEGORY_LABELS } from '../types';
import { formatCurrency } from '../service';
import styles from './Financial.module.css';

const SERVICE_CATEGORIES = Object.keys(SERVICE_CATEGORY_LABELS) as ServiceCategory[];

interface ServiceCatalogProps {
    services: FinancialService[];
    onRefresh: () => void;
}

interface ServiceFormData {
    name: string;
    description: string;
    category: ServiceCategory;
    default_price: string;
}

const EMPTY_FORM: ServiceFormData = {
    name: '',
    description: '',
    category: 'CONSULTATION',
    default_price: '',
};

export default function ServiceCatalog({ services, onRefresh }: ServiceCatalogProps) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<ServiceFormData>(EMPTY_FORM);
    const [formError, setFormError] = useState('');
    const [isPending, startTransition] = useTransition();

    function openCreate() {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setFormError('');
        setShowForm(true);
    }

    function openEdit(svc: FinancialService) {
        setEditingId(svc.id);
        setForm({
            name: svc.name,
            description: svc.description ?? '',
            category: svc.category,
            default_price: svc.default_price.toFixed(2),
        });
        setFormError('');
        setShowForm(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormError('');
        const price = parseFloat(form.default_price);
        if (!form.name.trim()) { setFormError('Nome é obrigatório.'); return; }
        if (isNaN(price) || price < 0) { setFormError('Valor inválido.'); return; }

        startTransition(async () => {
            const input: CreateServiceInput = {
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                category: form.category,
                default_price: price,
            };
            const result = editingId
                ? await updateServiceAction(editingId, input)
                : await createServiceAction(input);

            if (!result.success) {
                setFormError(result.error ?? 'Erro ao salvar.');
            } else {
                setShowForm(false);
                onRefresh();
            }
        });
    }

    function handleDeactivate(id: string, name: string) {
        if (!confirm(`Desativar "${name}"?`)) return;
        startTransition(async () => {
            await deactivateServiceAction(id);
            onRefresh();
        });
    }

    return (
        <div>
            {/* Add button */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={openCreate}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.6rem 1.2rem',
                        background: 'var(--primary, #2563eb)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                    }}
                >
                    <Plus size={15} />
                    Novo Serviço
                </button>
            </div>

            {/* Inline form */}
            {showForm && (
                <div className={styles.sectionCard} style={{ marginBottom: '1.5rem' }}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionHeaderLeft}>
                            {editingId ? 'Editar Serviço' : 'Novo Serviço'}
                        </span>
                    </div>
                    <div className={styles.sectionBody}>
                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Nome *</label>
                                    <input
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        placeholder="Ex: Consulta Clínica Geral"
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Categoria *</label>
                                    <select
                                        value={form.category}
                                        onChange={e => setForm(f => ({ ...f, category: e.target.value as ServiceCategory }))}
                                    >
                                        {SERVICE_CATEGORIES.map(c => (
                                            <option key={c} value={c}>{SERVICE_CATEGORY_LABELS[c]}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Preço padrão (R$) *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.default_price}
                                        onChange={e => setForm(f => ({ ...f, default_price: e.target.value }))}
                                        placeholder="0,00"
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Descrição</label>
                                    <input
                                        value={form.description}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        placeholder="Opcional"
                                    />
                                </div>
                            </div>
                            {formError && <div className={styles.errorMsg}>{formError}</div>}
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    disabled={isPending}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        background: 'var(--card-bg)',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    style={{
                                        padding: '0.5rem 1.2rem',
                                        border: 'none',
                                        borderRadius: '8px',
                                        background: 'var(--primary, #2563eb)',
                                        color: '#fff',
                                        cursor: isPending ? 'not-allowed' : 'pointer',
                                        fontWeight: 700,
                                        fontSize: '0.85rem',
                                        opacity: isPending ? 0.7 : 1,
                                    }}
                                >
                                    {isPending ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Service grid */}
            {services.length === 0 ? (
                <div className={styles.emptyState}>
                    Nenhum serviço cadastrado. Clique em &quot;Novo Serviço&quot; para começar.
                </div>
            ) : (
                <div className={styles.serviceCatalogGrid}>
                    {services.map(svc => (
                        <div key={svc.id} className={`${styles.serviceCard} ${!svc.active ? styles.inactive : ''}`}>
                            <div className={styles.serviceName}>{svc.name}</div>
                            <div className={styles.serviceCategory}>
                                {SERVICE_CATEGORY_LABELS[svc.category]}
                                {!svc.active && ' · Inativo'}
                            </div>
                            <div className={styles.servicePrice}>
                                {formatCurrency(svc.default_price)}
                            </div>
                            {svc.description && (
                                <div className={styles.subtext}>{svc.description}</div>
                            )}
                            <div className={styles.serviceActions}>
                                <button
                                    className={styles.actionBtn}
                                    onClick={() => openEdit(svc)}
                                    title="Editar"
                                >
                                    <Pencil size={13} /> Editar
                                </button>
                                {svc.active && (
                                    <button
                                        className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                        onClick={() => handleDeactivate(svc.id, svc.name)}
                                        disabled={isPending}
                                        title="Desativar"
                                    >
                                        <PowerOff size={13} /> Desativar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
