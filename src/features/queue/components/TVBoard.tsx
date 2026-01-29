'use client';

import { useEffect, useState } from 'react';
import { fetchTVQueueAction } from '@/app/actions/queue';
import { QueueItem } from '@/features/queue/types';

export default function TVBoard() {
    const [items, setItems] = useState<Partial<QueueItem>[]>([]);
    const [lastUpdated, setLastUpdated] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            const data = await fetchTVQueueAction();
            setItems(data);
            setLastUpdated(new Date().toLocaleTimeString());
        };

        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const called = items.filter(i => i.status === 'CALLED');
    const waiting = items.filter(i => i.status === 'WAITING').slice(0, 5); // Show next 5

    return (
        <div style={{ height: '100vh', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', padding: '2rem', backgroundColor: '#222', color: 'white', fontFamily: 'sans-serif' }}>
            {/* Left: Current Calls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <h1 style={{ borderBottom: '2px solid #555', paddingBottom: '1rem' }}>Calling Now</h1>
                {called.length > 0 ? called.map(item => (
                    <div key={item.ticketCode} style={{ padding: '3rem', backgroundColor: '#0070f3', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                        <div style={{ fontSize: '6rem', fontWeight: 'bold' }}>{item.ticketCode}</div>
                        <div style={{ fontSize: '2rem', marginTop: '1rem' }}>Proceed to Room 1</div>
                    </div>
                )) : (
                    <div style={{ padding: '3rem', backgroundColor: '#444', borderRadius: '16px', textAlign: 'center', color: '#888' }}>
                        <h2>No active calls</h2>
                    </div>
                )}
            </div>

            {/* Right: Next */}
            <div>
                <h2 style={{ borderBottom: '2px solid #555', paddingBottom: '1rem', marginBottom: '1rem' }}>Next</h2>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {waiting.map(item => (
                        <li key={item.ticketCode} style={{ padding: '1.5rem', backgroundColor: '#333', borderRadius: '8px', fontSize: '2rem', textAlign: 'center' }}>
                            {item.ticketCode}
                        </li>
                    ))}
                </ul>
            </div>

            <div style={{ position: 'fixed', bottom: '1rem', right: '1rem', fontSize: '0.8rem', color: '#666' }}>
                Updated: {lastUpdated}
            </div>
        </div>
    );
}
