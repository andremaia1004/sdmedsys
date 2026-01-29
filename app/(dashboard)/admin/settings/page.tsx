'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { fetchSettingsAction, updateSettingsAction } from '@/app/actions/admin';
import { ClinicSettings } from '@/features/admin/settings/types';

export default function SettingsAdminPage() {
    const [settings, setSettings] = useState<ClinicSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await fetchSettingsAction();
            setSettings(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;

        setIsSaving(true);
        try {
            await updateSettingsAction(settings);
            alert('Configurações atualizadas com sucesso!');
        } catch (err) {
            alert('Erro ao atualizar configurações');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Carregando configurações...</div>;
    if (!settings) return <div style={{ padding: '2rem' }}>Erro ao carregar configurações.</div>;

    return (
        <div style={{ padding: '1.5rem', maxWidth: '800px' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>Configurações da Clínica</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Ajuste os parâmetros globais do sistema</p>

            <form onSubmit={handleSave}>
                <Card header="Identificação e Geral" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <Input
                            label="Nome da Clínica"
                            value={settings.clinicName}
                            onChange={e => setSettings({ ...settings, clinicName: e.target.value })}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Input
                                label="Duração Padrão da Consulta (minutos)"
                                type="number"
                                value={settings.appointmentDurationMinutes}
                                onChange={e => setSettings({ ...settings, appointmentDurationMinutes: parseInt(e.target.value) })}
                            />
                            <Input
                                label="Prefixo da Senha (Fila)"
                                value={settings.queuePrefix}
                                onChange={e => setSettings({ ...settings, queuePrefix: e.target.value })}
                            />
                        </div>
                    </div>
                </Card>

                <Card header="Painel de TV" style={{ marginBottom: '2rem' }}>
                    <div style={{ padding: '1rem' }}>
                        <Input
                            label="Intervalo de Atualização do Painel (segundos)"
                            type="number"
                            value={settings.tvRefreshSeconds}
                            onChange={e => setSettings({ ...settings, tvRefreshSeconds: parseInt(e.target.value) })}
                        />
                    </div>
                </Card>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="primary" type="submit" disabled={isSaving} style={{ width: '200px' }}>
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
