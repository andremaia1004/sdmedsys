'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QueueItemWithPatient } from '../types';
import styles from '../styles/Queue.module.css';

export default function TVBoard({
    items = [],
    clinicName = 'SDMED SYS',
    refreshSeconds = 30
}: {
    items?: Partial<QueueItemWithPatient>[],
    clinicName?: string,
    refreshSeconds?: number
}) {
    const router = useRouter();
    const [calling, setCalling] = useState<Partial<QueueItemWithPatient> | null>(null);
    const [mounted, setMounted] = useState(false);

    // Identify CALLED item to ring/blink
    const currentCalled = items.find(i => i.status === 'CALLED');

    useEffect(() => {
        setMounted(true);

        // Auto-refresh data
        const interval = setInterval(() => {
            router.refresh();
        }, refreshSeconds * 1000);

        return () => clearInterval(interval);
    }, [router, refreshSeconds]);

    useEffect(() => {
        if (currentCalled && currentCalled.id !== calling?.id) {
            setCalling(currentCalled);
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => { }); // Optional: notification sound

            const timer = setTimeout(() => setCalling(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [currentCalled, calling]);

    const waiting = items.filter(i => i.status === 'WAITING').slice(0, 5);

    return (
        <div className={styles.tvContainer}>
            <div className={styles.mainDisplay}>
                <div className={styles.callingLabel}>CHAMANDO AGORA</div>
                <div className={`${styles.ticketCard} ${calling ? styles.pulse : ''}`}>
                    <div className={styles.ticketNumber}>{currentCalled?.ticketCode || '---'}</div>
                    <div className={styles.patientName}>{currentCalled?.patientName || 'Aguardando próxima chamada'}</div>
                </div>
            </div>

            <aside className={styles.sideDisplay}>
                <div className={styles.nextLabel}>PRÓXIMOS</div>
                <div className={styles.nextList}>
                    {waiting.map(item => (
                        <div key={item.id} className={styles.nextItem}>
                            <span className={styles.nextTicket}>{item.ticketCode}</span>
                            <span className={styles.nextName}>{item.patientName}</span>
                        </div>
                    ))}
                    {waiting.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                            Ninguém na fila
                        </div>
                    )}
                </div>
            </aside>

            <footer className={styles.tvFooter}>
                <div className={styles.clinicName}>{clinicName}</div>
                <div className={styles.clock}>
                    {mounted && new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </footer>
        </div>
    );
}
