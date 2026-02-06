'use client';

import { useState } from 'react';
import { Patient } from '../types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import styles from '../styles/Patients.module.css';

export default function PatientList({ patients, canEdit = false }: { patients: Patient[], canEdit?: boolean }) {
    const [search, setSearch] = useState('');

    const filtered = (patients || []).filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.document && p.document.includes(search)) ||
        (p.phone && p.phone.includes(search))
    );

    return (
        <div className={styles.container}>
            <div className={styles.searchBar}>
                <Input
                    placeholder="Pesquisar por nome ou CPF..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    fullWidth
                />
            </div>

            <Table headers={['Nome do Paciente', 'Documento/CPF', 'Data Nasc.', 'Ações']}>
                {filtered.map(p => (
                    <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td>{p.document}</td>
                        <td style={{ color: 'var(--text-muted)' }}>
                            {p.birthDate ? new Date(p.birthDate).toLocaleDateString('pt-BR') : 'N/A'}
                        </td>
                        <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button size="sm" variant="secondary">Ver</Button>
                                {canEdit && <Button size="sm" variant="ghost">Editar</Button>}
                            </div>
                        </td>
                    </tr>
                ))}
                {filtered.length === 0 && (
                    <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            Nenhum paciente encontrado.
                        </td>
                    </tr>
                )}
            </Table>
        </div>
    );
}
