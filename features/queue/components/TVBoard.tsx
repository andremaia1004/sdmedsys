'use client';

import { useEffect, useState } from 'react';
import { QueueItemWithPatient } from '../types';
import styles from '../styles/Queue.module.css';

export default function TVBoard({ items = [] }: { items?: Partial<QueueItemWithPatient>[] }) {
    const [calling, setCalling] = useState<Partial<QueueItemWithPatient> | null>(null);

    // Identify CALLED item to ring/blink
    const currentCalled = items.find(i => i.status === 'CALLED');

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
                <div className={styles.clinicName}>SDMED <span style={{ color: 'var(--accent)' }}>SYS</span></div>
                <div className={styles.clock}>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
            </footer>
        </div>
    );
}
