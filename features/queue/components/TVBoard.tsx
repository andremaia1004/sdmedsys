'use client';

import { useEffect, useState } from 'react';
import { fetchTVQueueAction } from '@/app/actions/queue';
import { QueueItem } from '@/features/queue/types';
import styles from '../styles/Queue.module.css';

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
        <div className={styles.tvContainer}>
            {/* Left: Current Calls */}
            <div className={styles.callingSection}>
                <h1 className={styles.tvHeader}>Calling Now</h1>
                {called.length > 0 ? called.map(item => (
                    <div key={item.ticketCode} className={styles.calledCard}>
                        <div className={styles.calledTicket}>{item.ticketCode}</div>
                        <div className={styles.calledRoom}>Proceed to Consult Office 01</div>
                    </div>
                )) : (
                    <div style={{
                        padding: '4rem',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: '24px',
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.3)',
                        border: '2px dashed rgba(255,255,255,0.1)'
                    }}>
                        <h2 style={{ fontSize: '2rem' }}>Awaiting new patients...</h2>
                    </div>
                )}
            </div>

            {/* Right: Next */}
            <div className={styles.nextSection}>
                <h2 className={styles.nextTitle}>Next in Queue</h2>
                <ul className={styles.nextList}>
                    {waiting.map(item => (
                        <li key={item.ticketCode} className={styles.nextItem}>
                            {item.ticketCode}
                        </li>
                    ))}
                    {waiting.length === 0 && (
                        <p style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>No one in line</p>
                    )}
                </ul>
            </div>

            <div style={{
                position: 'fixed',
                bottom: '2rem',
                left: '3rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--accent)',
                    borderRadius: '8px'
                }}>
                    SDMED SYS
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem' }}>
                    Updated: {lastUpdated}
                </div>
            </div>
        </div>
    );
}
