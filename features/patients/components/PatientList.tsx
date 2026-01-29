'use client';

import { useState, useEffect } from 'react';
import { Patient } from '@/features/patients/types';
import { searchPatientsAction } from '../actions';

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
        <div>
            <div style={{ marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="Search by name, document or phone..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                {loading && <span style={{ marginLeft: '1rem', color: '#888' }}>Searching...</span>}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ textAlign: 'left', backgroundColor: '#f5f5f5' }}>
                        <th style={{ padding: '0.5rem' }}>Name</th>
                        <th style={{ padding: '0.5rem' }}>Document</th>
                        <th style={{ padding: '0.5rem' }}>Phone</th>
                        <th style={{ padding: '0.5rem' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {patients.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '0.5rem' }}>{p.name}</td>
                            <td style={{ padding: '0.5rem' }}>{p.document}</td>
                            <td style={{ padding: '0.5rem' }}>{p.phone}</td>
                            <td style={{ padding: '0.5rem' }}>
                                {(role === 'ADMIN' || role === 'SECRETARY') && (
                                    <button style={{ marginRight: '0.5rem', cursor: 'pointer' }}>Edit</button>
                                )}
                                <button style={{ cursor: 'pointer' }}>View</button>
                            </td>
                        </tr>
                    ))}
                    {patients.length === 0 && (
                        <tr>
                            <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>No patients found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
