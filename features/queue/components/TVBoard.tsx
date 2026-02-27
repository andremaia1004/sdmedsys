'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QueueItemWithPatient } from '../types';
import styles from '../styles/Queue.module.css';
import { Building2, Activity, ArrowRight } from 'lucide-react';

export default function TVBoard({
    items = [],
    clinicName = 'SDMED SYS',
    logoUrl,
    refreshSeconds = 30
}: {
    items?: QueueItemWithPatient[],
    clinicName?: string,
    logoUrl?: string,
    refreshSeconds?: number
}) {
    const router = useRouter();
    const [calling, setCalling] = useState<QueueItemWithPatient | null>(null);
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
                    <div className={styles.ticketNumber}>
                        {currentCalled?.ticket_code || '---'}
                    </div>
                    <div className={styles.patientName}>{currentCalled?.patient_name || 'Aguardando...'}</div>

                    {currentCalled && (
                        <div className={styles.doctorHighlight}>
                            <div className={styles.doctorLabel}>MÉDICO</div>
                            <div className={styles.doctorValue}>
                                {currentCalled.doctor_name || 'Médico de Plantão'}
                                {currentCalled.doctor_specialty && (
                                    <span className={styles.specialtyTag}> — {currentCalled.doctor_specialty}</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <aside className={styles.sideDisplay}>
                <div className={styles.nextLabel}>Próximos</div>
                <div className={styles.nextList}>
                    {waiting.map(item => (
                        <div key={item.id} className={styles.nextItem}>
                            <div className={styles.nextLeft}>
                                <span className={styles.nextTicket}>{item.ticket_code}</span>
                                <div className={styles.nextMeta}>
                                    <span className={styles.nextName}>{item.patient_name}</span>
                                    <span className={styles.nextDoctor}>
                                        {item.doctor_name || 'Clínico'}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.nextRight}>
                                {item.priority === 'PRIORITY' && <span className={styles.tvPriorityBadgeSmall}>PR</span>}
                            </div>
                        </div>
                    ))}
                    {waiting.length === 0 && (
                        <div className={styles.emptyState}>
                            Fila vazia
                        </div>
                    )}
                </div>
            </aside>

            <footer className={styles.tvFooter}>
                <div className={styles.clinicName}>
                    {logoUrl ? (
                        <img src={logoUrl} alt={clinicName} className={styles.tvClinicLogo} />
                    ) : (
                        <Building2 size={24} color="var(--accent)" />
                    )}
                    <span>{clinicName}</span>
                </div>
                <div className={styles.clock}>
                    {mounted && new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </footer>
        </div >
    );
}
