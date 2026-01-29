'use client';

import { useState, useEffect } from 'react';
import { Patient } from '@/features/patients/types';
import { searchPatientsAction } from '../actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from '../styles/Patients.module.css';

export default function PatientList({ initialPatients = [], role }: { initialPatients?: Patient[], role: string }) {
    const [query, setQuery] = useState('');
    const [patients, setPatients] = useState<Patient[]>(initialPatients);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            setLoading(true);
            const results = await searchPatientsAction(query);
            setPatients(results);
            setLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className={styles.tableContainer}>
            <div className={styles.searchBar}>
                <Input
                    type="text"
                    placeholder="Search by name, document or phone..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                {loading && <span className={styles.searchLoading}>Searching...</span>}
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Document</th>
                        <th>Phone</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {patients.map(p => (
                        <tr key={p.id}>
                            <td><strong>{p.name}</strong></td>
                            <td>{p.document}</td>
                            <td>{p.phone}</td>
                            <td>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {(role === 'ADMIN' || role === 'SECRETARY') && (
                                        <Button variant="ghost" size="sm">Edit</Button>
                                    )}
                                    <Button variant="secondary" size="sm">View</Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {patients.length === 0 && (
                        <tr>
                            <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No patients found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
