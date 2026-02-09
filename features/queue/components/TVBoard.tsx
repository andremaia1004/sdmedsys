'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QueueItemWithPatient } from '../types';
import styles from '../styles/Queue.module.css';
import { Building2, Activity, ArrowRight } from 'lucide-react';

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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);

        // Auto-refresh data
        const interval = setInterval(() => {
            router.refresh();
        }, refreshSeconds * 1000);

        return () => clearInterval(interval);
    }, [router, refreshSeconds]);

    const lastCalledId = useRef<string | null>(null);

    useEffect(() => {
        if (currentCalled && currentCalled.id !== lastCalledId.current) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCalling(currentCalled);
            lastCalledId.current = currentCalled.id || null;

            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => { }); // Optional: notification sound

            const timer = setTimeout(() => setCalling(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [currentCalled]);
    const waiting = items.filter(i => i.status === 'WAITING').slice(0, 5);

    return (
        <div className={styles.tvContainer}>
            <div className={styles.mainDisplay}>
                <div className={styles.callingLabel}>
                    <Activity size={32} />
                    Chamando Agora
                </div>
                <div className={`${styles.ticketCard} ${calling ? styles.pulse : ''}`}>
                    <div className={styles.ticketNumber}>{currentCalled?.ticketCode || '---'}</div>
                    <div className={styles.patientName}>{currentCalled?.patientName || 'Aguardando...'}</div>
                </div>
            </div>

            <aside className={styles.sideDisplay}>
                <div className={styles.nextLabel}>Próximos</div>
                <div className={styles.nextList}>
                    {waiting.map(item => (
                        <div key={item.id} className={styles.nextItem}>
                            <span className={styles.nextTicket}>{item.ticketCode}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span className={styles.nextName}>{item.patientName}</span>
                                <ArrowRight size={20} color="rgba(255,255,255,0.2)" />
                            </div>
                        </div>
                    ))}
                    {waiting.length === 0 && (
                        <div style={{ padding: '4rem 2rem', textAlign: 'center', opacity: 0.3, border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
                            Fila vazia
                        </div>
                    )}
                </div>
            </aside>

            <footer className={styles.tvFooter}>
                <div className={styles.clinicName}>
                    <Building2 size={24} color="var(--accent)" />
                    {clinicName}
                </div>
                <div className={styles.clock}>
                    {mounted && new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </footer>
        </div >
    );
}
