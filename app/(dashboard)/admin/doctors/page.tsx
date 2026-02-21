'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { fetchDoctorsAction, createDoctorAction, updateDoctorAction } from '@/app/actions/admin';
import { Doctor } from '@/features/doctors/types';
import { UserPlus, UserMinus, ShieldCheck, Mail, Phone, Hash, Award, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function DoctorsAdminPage() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { showToast } = useToast();

    // Form Stats
    const [name, setName] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [crm, setCrm] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [createAuth, setCreateAuth] = useState(true);

    useEffect(() => {
        loadDoctors();
    }, []);

    const loadDoctors = async () => {
        setLoading(true);
        try {
            const data = await fetchDoctorsAction(false);
            setDoctors(data);
        } catch {
            console.error('Failed to fetch doctors');
        } finally {
            setLoading(false);
        }
    };

    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // ... (existing useEffect) ...

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('specialty', specialty);
            formData.append('crm', crm);
            formData.append('phone', phone);
            formData.append('email', email);
            if (password) formData.append('password', password);
            formData.append('createAuth', createAuth.toString());

            let res;
            if (isEditing && editingId) {
                res = await updateDoctorAction(editingId, {
                    name,
                    specialty,
                    crm,
                    phone,
                    email,
                    password: password || undefined
                });
            } else {
                res = await createDoctorAction(formData);
            }

            if (res.success) {
                resetForm();
                await loadDoctors();
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
        setSpecialty('');
        setCrm('');
        setPhone('');
        setEmail('');
        setPassword('');
        setIsEditing(false);
        setEditingId(null);
        setShowForm(false);
        setCreateAuth(true);
    };

    const handleEdit = (doctor: Doctor) => {
        setName(doctor.name);
        setSpecialty(doctor.specialty || '');
        setCrm(doctor.crm || '');
        setPhone(doctor.phone || '');
        setEmail(doctor.email || '');
        setPassword(''); // Always blank for security, user enters only if changing
        setCreateAuth(!!doctor.profileId);

        setIsEditing(true);
        setEditingId(doctor.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleActive = async (doctor: Doctor) => {
        try {
            await updateDoctorAction(doctor.id, { active: !doctor.active });
            await loadDoctors();
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
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.4s ease-out' }}>
            <style jsx global>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 850, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
                        Gestão de Profissionais
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.4rem', fontWeight: 500 }}>
                        Controle central de acesso e dados dos médicos da clínica
                    </p>
                </div>
                <Button
                    variant={showForm ? 'secondary' : 'primary'}
                    onClick={() => {
                        if (showForm) resetForm();
                        else setShowForm(true);
                    }}
                    style={{ borderRadius: '12px', padding: '0.75rem 1.5rem', fontWeight: 700, boxShadow: showForm ? 'none' : '0 4px 12px rgba(0, 45, 94, 0.2)' }}
                >
                    {showForm ? 'Cancelar' : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <UserPlus size={18} />
                            Novo Médico
                        </div>
                    )}
                </Button>
            </div>

            {showForm && (
                <Card
                    style={{
                        marginBottom: '2.5rem',
                        border: 'none',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                        borderRadius: '20px',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #001f41 100%)', padding: '1.5rem 2rem', color: '#fff' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                            {isEditing ? 'Editar Médico' : 'Cadastrar Novo Médico'}
                        </h3>
                        <p style={{ margin: '0.25rem 0 0 0', opacity: 0.8, fontSize: '0.875rem' }}>
                            {isEditing ? 'Atualize os dados ou altere a senha de acesso' : 'Preencha os dados e configure as credenciais de acesso'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {/* ... (First column: Personal Data - remains same) ... */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                                <h4 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dados Pessoais</h4>
                            </div>
                            <Input label="Nome Completo" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Dr. Roberto Silva" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input label="CRM" value={crm} onChange={e => setCrm(e.target.value)} placeholder="000.000-UF" />
                                <Input label="Especialidade" value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="Ex: Cardiologia" />
                            </div>
                            <Input label="Celular" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
                        </div>

                        {/* ... (Second column: Credentials) ... */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                                <h4 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Credenciais de Acesso</h4>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <input
                                    type="checkbox"
                                    checked={createAuth}
                                    onChange={e => setCreateAuth(e.target.checked)}
                                    id="createAuth"
                                    disabled={isEditing && !!email} // Prevent unchecking if already has account
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <label htmlFor="createAuth" style={{ fontWeight: 700, color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9375rem' }}>
                                    {isEditing ? 'Manter conta de acesso ativa' : 'Criar conta de acesso para este médico'}
                                </label>
                            </div>

                            {createAuth && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.2s ease-out' }}>
                                    <Input
                                        label="E-mail de Login"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        type="email"
                                        placeholder="medico@exemplo.com"
                                        disabled={isEditing} // Email is hard to change due to Auth linking
                                    />
                                    <div style={{ position: 'relative' }}>
                                        <Input
                                            label={isEditing ? "Nova Senha (deixe em branco para manter)" : "Senha de Acesso"}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            required={!isEditing}
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder={isEditing ? "Nova senha..." : "Mínimo 6 caracteres"}
                                        />
                                        <div style={{ position: 'absolute', right: '0.75rem', top: '2.3rem', display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={generatePassword}
                                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent)', fontWeight: 700, fontSize: '0.75rem' }}
                                            >
                                                Gerar
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: '#fffbeb', padding: '0.75rem', borderRadius: '8px', border: '1px solid #fef3c7' }}>
                                        <strong>Atenção:</strong> {isEditing ? 'Se preenchida, a nova senha valerá imediatamente.' : 'Ao clicar em cadastrar, as credenciais serão ativadas imediatamente.'}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ gridColumn: 'span 2', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={isSaving}
                                style={{ padding: '0.85rem 3rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 800, background: 'var(--accent)' }}
                            >
                                {isSaving ? 'Processando...' : (isEditing ? 'Salvar Alterações' : 'Finalizar Cadastro Master')}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            <Card padding="none" style={{ borderRadius: '20px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <Table headers={['Profissional', 'CRM / Especialidade', 'Contato', 'Status', 'Ações']}>
                    {loading ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem' }}>
                            <div style={{ color: 'var(--text-muted)' }}>Buscando base de médicos...</div>
                        </td></tr>
                    ) : doctors.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem' }}>Nenhum médico cadastrado.</td></tr>
                    ) : doctors.map(doc => (
                        <tr key={doc.id}>
                            <td style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                        {doc.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>{doc.name}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                            {doc.profileId ? <ShieldCheck size={14} style={{ color: 'var(--success)' }} /> : <UserMinus size={14} />}
                                            {doc.profileId ? 'Conta Vinculada' : 'Sem conta de acesso'}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)' }}>
                                        <Award size={14} /> {doc.specialty || 'Clínico'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                        <Hash size={14} /> CRM: {doc.crm || '-'}
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                        <Mail size={14} /> {doc.email || '-'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                        <Phone size={14} /> {doc.phone || '-'}
                                    </div>
                                </div>
                            </td>
                            <td>
                                <Badge variant={doc.active ? 'success' : 'secondary'} style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 800 }}>
                                    {doc.active ? 'ATIVO' : 'INATIVO'}
                                </Badge>
                            </td>
                            <td>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleEdit(doc)}
                                        style={{ borderRadius: '8px', fontWeight: 700 }}
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        variant={doc.active ? 'outline' : 'primary'}
                                        size="sm"
                                        onClick={() => toggleActive(doc)}
                                        style={{ borderRadius: '8px', fontWeight: 700 }}
                                    >
                                        {doc.active ? 'Desativar' : 'Ativar'}
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
