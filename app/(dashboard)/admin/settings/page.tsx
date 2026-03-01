'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { fetchSettingsAction, updateSettingsAction } from '@/app/actions/admin';
import { ClinicSettings } from '@/features/admin/settings/types';
import { useToast } from '@/components/ui/Toast';

export default function SettingsAdminPage() {
    const [settings, setSettings] = useState<ClinicSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await fetchSettingsAction();
            setSettings(data);
        } catch {
            console.error('Failed to fetch settings');
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
            showToast('success', 'Configurações atualizadas com sucesso!');
        } catch {
            showToast('error', 'Erro ao atualizar configurações');
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

                        {/* Logo Upload Section */}
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            {settings.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={settings.logoUrl} alt="Logo da Clínica" style={{ width: '80px', height: '80px', objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem' }} />
                            ) : (
                                <div style={{ width: '80px', height: '80px', border: '1px dashed #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px', textAlign: 'center' }}>
                                    Sem<br />Logo
                                </div>
                            )}
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Logo da Clínica</label>
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        setIsSaving(true);
                                        const { createBrowserSupabaseClient } = await import('@/lib/supabase-browser');
                                        const supabase = createBrowserSupabaseClient();

                                        const fileExt = file.name.split('.').pop();
                                        const fileName = `${settings.clinicId}-${Date.now()}.${fileExt}`;

                                        const { error } = await supabase.storage
                                            .from('clinic_assets')
                                            .upload(fileName, file, { upsert: true });

                                        if (error) {
                                            console.error('Upload error', error);
                                            showToast('error', 'Erro ao fazer upload da logomarca');
                                            setIsSaving(false);
                                            return;
                                        }

                                        const { data: { publicUrl } } = supabase.storage.from('clinic_assets').getPublicUrl(fileName);
                                        setSettings({ ...settings, logoUrl: publicUrl });
                                        setIsSaving(false);
                                        showToast('success', 'Logo enviada! Clique em salvar para confirmar.');
                                    }}
                                    style={{ fontSize: '0.875rem' }}
                                />
                                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Recomendado: Imagem PNG com fundo transparente</p>
                            </div>
                        </div>

                        <Input
                            label="Nome da Clínica"
                            value={settings.clinicName}
                            onChange={e => setSettings({ ...settings, clinicName: e.target.value })}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Input
                                label="Telefone de Contato"
                                value={settings.phone || ''}
                                onChange={e => setSettings({ ...settings, phone: e.target.value })}
                                placeholder="(00) 00000-0000"
                            />
                            <Input
                                label="Website"
                                value={settings.website || ''}
                                onChange={e => setSettings({ ...settings, website: e.target.value })}
                                placeholder="https://www.suaclinica.com.br"
                            />
                        </div>
                        <Input
                            label="Endereço Completo"
                            value={settings.address || ''}
                            onChange={e => setSettings({ ...settings, address: e.target.value })}
                            placeholder="Rua Exemplo, 123, Bairro, Cidade - UF"
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
