'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QueueItemWithPatient } from '../types';
import styles from '../styles/TVBoard.module.css';
import { Building2, BellRing, Star, ListOrdered } from 'lucide-react';

export default function TVBoard({
    items = [],
    clinicName = 'SDMED SYS',
    logoUrl,
    refreshSeconds = 30
}: {
    items?: QueueItemWithPatient[];
    clinicName?: string;
    logoUrl?: string;
    refreshSeconds?: number;
}) {
    const router = useRouter();
    const [calling, setCalling] = useState<QueueItemWithPatient | null>(null);
    const [mounted, setMounted] = useState(false);

    // Identify CALLED item to ring/blink. 
    const currentCalled = items.find(i => i.status === 'CALLED');

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);

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
            audio.play().catch(() => { });

            const timer = setTimeout(() => setCalling(null), 8000);
            return () => clearTimeout(timer);
        }
    }, [currentCalled]);

    const waiting = items
        .filter(i => i.status === 'WAITING')
        .sort((a, b) => {
            if (a.priority === 'PRIORITY' && b.priority !== 'PRIORITY') return -1;
            if (b.priority === 'PRIORITY' && a.priority !== 'PRIORITY') return 1;
            const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return timeA - timeB;
        })
        .slice(0, 6); // Show up to 6 on the right side

    return (
        <div className={styles.tvContainer}>
            <div className={styles.tvLayout}>
                {/* Main Display: Currently Calling Area */}
                <main className={styles.mainDisplay}>
                    <header className={styles.tvHeader}>
                        {logoUrl ? (
                            <img src={logoUrl} alt={clinicName} className={styles.tvClinicLogo} />
                        ) : (
                            <Building2 size={60} color="#38bdf8" />
                        )}
                        {!logoUrl && <h1 className={styles.clinicName}>{clinicName}</h1>}
                    </header>

                    <div className={styles.callingLabel}>
                        <BellRing size={32} />
                        Chamada Atual
                        <BellRing size={32} />
                    </div>

                    <div className={`${styles.ticketCard} ${calling ? styles.pulse : ''}`}>
                        <div className={styles.ticketNumberRow}>
                            <div className={styles.ticketNumber}>
                                {currentCalled?.ticket_code || '---'}
                            </div>
                            {currentCalled?.priority === 'PRIORITY' && (
                                <div className={styles.priorityBadgeMain}>
                                    <Star fill="currentColor" size={28} />
                                    Prioridade
                                </div>
                            )}
                        </div>

                        <div className={styles.patientName}>
                            {currentCalled?.patient_name || 'Aguardando próximo...'}
                        </div>

                        {currentCalled && (
                            <div className={styles.doctorHighlight}>
                                <div className={styles.doctorLabel}>Direcione-se para</div>
                                <div className={styles.doctorValue}>
                                    Dr. {currentCalled.doctor_name?.split(' ')[0] || 'Plantonista'}
                                    {currentCalled.doctor_specialty && (
                                        <span className={styles.specialtyTag}>{currentCalled.doctor_specialty}</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                {/* Side Queue List */}
                <aside className={styles.nextUpSection}>
                    <div className={styles.nextLabel}>
                        <ListOrdered size={28} />
                        Próximos da Fila
                    </div>
                    <div className={styles.nextList}>
                        {waiting.map(item => (
                            <div 
                                key={item.id} 
                                className={`${styles.nextItem} ${item.priority === 'PRIORITY' ? styles.priorityBorder : ''}`}
                            >
                                <div className={styles.nextLeft}>
                                    <span className={styles.nextTicket}>{item.ticket_code}</span>
                                    <div className={styles.nextMeta}>
                                        <span className={styles.nextName}>{item.patient_name}</span>
                                        <span className={styles.nextDoctor}>
                                            Dr. {item.doctor_name?.split(' ')[0] || 'Clínico'}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.nextRight}>
                                    {item.priority === 'PRIORITY' && (
                                        <span className={styles.priorityBadgeSmall}>
                                            PR
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {waiting.length === 0 && (
                            <div className={styles.emptyState}>
                                Nenhum paciente na fila de espera no momento.
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
