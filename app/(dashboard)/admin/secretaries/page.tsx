'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { fetchSecretariesAction, createSecretaryAction, updateSecretaryAction } from '@/app/actions/admin';
import { Secretary } from '@/features/secretaries/types';
import { UserPlus, UserMinus, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function SecretariesAdminPage() {
    const [secretaries, setSecretaries] = useState<Secretary[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { showToast } = useToast();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [createAuth, setCreateAuth] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        loadSecretaries();
    }, []);

    const loadSecretaries = async () => {
        setLoading(true);
        try {
            const data = await fetchSecretariesAction();
            setSecretaries(data);
        } catch {
            console.error('Failed to fetch secretaries');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('phone', phone);
            formData.append('email', email);
            if (password) formData.append('password', password);
            formData.append('createAuth', createAuth.toString());

            let res;
            if (isEditing && editingId) {
                res = await updateSecretaryAction(editingId, {
                    name,
                    phone,
                    email,
                    password: password || undefined
                });
            } else {
                res = await createSecretaryAction(formData);
            }

            if (res.success) {
                resetForm();
                await loadSecretaries();
                showToast('success', isEditing ? 'Secretária atualizada!' : 'Secretária cadastrada!');
            } else {
                showToast('error', res.error || 'Erro ao processar');
            }
        } catch (err: unknown) {
            console.error(err);
            const msg = err instanceof Error ? err.message : 'Erro inesperado';
            showToast('error', msg);
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setName('');
        setPhone('');
        setEmail('');
        setPassword('');
        setIsEditing(false);
        setEditingId(null);
        setShowForm(false);
        setCreateAuth(true);
    };

    const handleEdit = (sec: Secretary) => {
        setName(sec.name);
        setPhone(sec.phone || '');
        setEmail(sec.email || '');
        setPassword('');
        setCreateAuth(!!sec.profileId);
        setIsEditing(true);
        setEditingId(sec.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleActive = async (sec: Secretary) => {
        try {
            await updateSecretaryAction(sec.id, { active: !sec.active });
            await loadSecretaries();
        } catch {
            showToast('error', 'Erro ao atualizar status');
        }
    };

    const generatePassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let retVal = "";
        for (let i = 0, n = charset.length; i < 12; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        setPassword(retVal);
        setShowPassword(true);
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Gestão de Funcionários</h1>
                    <p className="page-subtitle">Controle de acesso para o time de recepção e secretaria</p>
                </div>
                <Button
                    variant={showForm ? 'secondary' : 'primary'}
                    onClick={() => {
                        if (showForm) resetForm();
                        else setShowForm(true);
                    }}
                    style={{ borderRadius: '12px', padding: '0.75rem 1.5rem', fontWeight: 700 }}
                >
                    {showForm ? 'Cancelar' : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <UserPlus size={18} />
                            Novo Funcionário
                        </div>
                    )}
                </Button>
            </div>

            {showForm && (
                <Card style={{ marginBottom: '2.5rem', borderRadius: '20px', overflow: 'hidden' }}>
                    <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #001f41 100%)', padding: '1.5rem 2rem', color: '#fff' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                            {isEditing ? 'Editar Funcionário' : 'Cadastrar Novo Funcionário'}
                        </h3>
                    </div>

                    <form onSubmit={handleSubmit} style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                                <h4 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--primary)', textTransform: 'uppercase' }}>Dados Pessoais</h4>
                            </div>
                            <Input label="Nome Completo" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Ana Maria Souza" />
                            <Input label="Celular / WhatsApp" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                                <h4 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--primary)', textTransform: 'uppercase' }}>Credenciais</h4>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <input
                                    type="checkbox"
                                    checked={createAuth}
                                    onChange={e => setCreateAuth(e.target.checked)}
                                    id="createAuth"
                                    disabled={isEditing && !!email}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <label htmlFor="createAuth" style={{ fontWeight: 700, color: 'var(--primary)', cursor: 'pointer' }}>
                                    {isEditing ? 'Manter conta ativa' : 'Criar conta de acesso'}
                                </label>
                            </div>

                            {createAuth && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <Input
                                        label="E-mail de Login"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        type="email"
                                        placeholder="email@exemplo.com"
                                        disabled={isEditing}
                                    />
                                    <div style={{ position: 'relative' }}>
                                        <Input
                                            label={isEditing ? "Nova Senha (opcional)" : "Senha"}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            required={!isEditing}
                                            type={showPassword ? 'text' : 'password'}
                                        />
                                        <div style={{ position: 'absolute', right: '0.75rem', top: '2.3rem', display: 'flex', gap: '0.5rem' }}>
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                            <button type="button" onClick={generatePassword} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent)', fontWeight: 700, fontSize: '0.75rem' }}>
                                                Gerar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <Button variant="primary" type="submit" disabled={isSaving} style={{ padding: '0.85rem 3rem', borderRadius: '12px', fontWeight: 800 }}>
                                {isSaving ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Finalizar Cadastro')}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            <Card padding="none" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                <Table headers={['Nome', 'Contato', 'E-mail', 'Status', 'Ações']}>
                    {loading ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem' }}>Carregando funcionários...</td></tr>
                    ) : secretaries.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem' }}>Nenhum funcionário cadastrado.</td></tr>
                    ) : secretaries.map(sec => (
                        <tr key={sec.id}>
                            <td style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                        {sec.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>{sec.name}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {sec.profileId ? <ShieldCheck size={14} style={{ color: 'var(--success)' }} /> : <UserMinus size={14} />}
                                            {sec.profileId ? 'Conta Vinculada' : 'Sem conta'}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>{sec.phone || '-'}</td>
                            <td>{sec.email || '-'}</td>
                            <td>
                                <Badge variant={sec.active ? 'success' : 'secondary'}>
                                    {sec.active ? 'ATIVO' : 'INATIVO'}
                                </Badge>
                            </td>
                            <td>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Button variant="secondary" size="sm" onClick={() => handleEdit(sec)}>Editar</Button>
                                    <Button variant={sec.active ? 'outline' : 'primary'} size="sm" onClick={() => toggleActive(sec)}>
                                        {sec.active ? 'Desativar' : 'Ativar'}
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}
