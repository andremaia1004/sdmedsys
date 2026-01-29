'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { fetchDoctorsAction, createDoctorAction, updateDoctorAction } from '@/app/actions/admin';
import { Doctor } from '@/features/doctors/types';

export default function DoctorsAdminPage() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [name, setName] = useState('');
    const [specialty, setSpecialty] = useState('');

    useEffect(() => {
        loadDoctors();
    }, []);

    const loadDoctors = async () => {
        setLoading(true);
        try {
            const data = await fetchDoctorsAction(false);
            setDoctors(data);
        } catch (err) {
            console.error(err);
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
            formData.append('specialty', specialty);
            await createDoctorAction(formData);
            setName('');
            setSpecialty('');
            setShowForm(false);
            await loadDoctors();
        } catch (err) {
            alert('Erro ao criar médico');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleActive = async (doctor: Doctor) => {
        try {
            await updateDoctorAction(doctor.id, { active: !doctor.active });
            await loadDoctors();
        } catch (err) {
            alert('Erro ao atualizar status');
        }
    };

    return (
        <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ margin: 0 }}>Gestão de Profissionais</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Gerencie os médicos da clínica</p>
                </div>
                <Button variant="primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancelar' : 'Novo Médico'}
                </Button>
            </div>

            {showForm && (
                <Card header="Cadastrar Profissional" style={{ marginBottom: '2rem', maxWidth: '500px' }}>
                    <form onSubmit={handleSubmit} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <Input label="Nome Completo" value={name} onChange={e => setName(e.target.value)} required />
                        <Input label="Especialidade" value={specialty} onChange={e => setSpecialty(e.target.value)} />
                        <Button variant="primary" type="submit" disabled={isSaving}>
                            {isSaving ? 'Salvando...' : 'Cadastrar'}
                        </Button>
                    </form>
                </Card>
            )}

            <Card padding="none">
                <Table headers={['Nome', 'Especialidade', 'Status', 'Ações']}>
                    {loading ? (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</td></tr>
                    ) : doctors.map(doc => (
                        <tr key={doc.id}>
                            <td><strong>{doc.name}</strong></td>
                            <td>{doc.specialty || '-'}</td>
                            <td>
                                <Badge variant={doc.active ? 'success' : 'secondary'}>
                                    {doc.active ? 'Ativo' : 'Inativo'}
                                </Badge>
                            </td>
                            <td>
                                <Button
                                    variant={doc.active ? 'outline' : 'primary'}
                                    size="sm"
                                    onClick={() => toggleActive(doc)}
                                >
                                    {doc.active ? 'Desativar' : 'Ativar'}
                                </Button>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}
