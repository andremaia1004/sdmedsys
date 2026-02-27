'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QueueItemWithPatient } from '../types';
import styles from '../styles/TVBoard.module.css';
import { Building2, BellRing, Star } from 'lucide-react';

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

    // Identify CALLED item to ring/blink. Prioritize by status if there are multiple, though there should be only one CALLED usually.
    // If not, just take the first one.
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

            const timer = setTimeout(() => setCalling(null), 8000); // Blink for 8 seconds
            return () => clearTimeout(timer);
        }
    }, [currentCalled]);

    // Sort WAITING items: Priorities first, then by creation date
    const waiting = items
        .filter(i => i.status === 'WAITING')
        .sort((a, b) => {
            if (a.priority === 'PRIORITY' && b.priority !== 'PRIORITY') return -1;
            if (b.priority === 'PRIORITY' && a.priority !== 'PRIORITY') return 1;
            const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return timeA - timeB;
        })
        .slice(0, 4); // Show top 4 in grid

    return (
        <div className={styles.tvContainer}>
            {/* Header: Logo and Clinic Name */}
            <header className={styles.tvHeader}>
                {logoUrl ? (
                    <img src={logoUrl} alt={clinicName} className={styles.tvClinicLogo} />
                ) : (
                    <Building2 size={64} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                )}
                {/*  Only show clinic name if no logo, or maybe show it below the logo briefly */}
                {!logoUrl && <h1 className={styles.clinicName}>{clinicName}</h1>}
            </header>

            {/* Main Display: Currently Calling  (Fallback to the most recently called or empty if none) */}
            <main className={styles.mainDisplay}>
                <div className={styles.callingLabel}>
                    <BellRing size={36} />
                    CHAMANDO AGORA
                    <BellRing size={36} />
                </div>

                <div className={`${styles.ticketCard} ${calling ? styles.pulse : ''}`}>
                    <div className={styles.ticketNumberRow}>
                        <div className={styles.ticketNumber}>
                            {currentCalled?.ticket_code || '---'}
                        </div>
                        {currentCalled?.priority === 'PRIORITY' && (
                            <div className={styles.priorityBadgeMain}>
                                <Star fill="currentColor" size={32} />
                                PR
                            </div>
                        )}
                    </div>

                    <div className={styles.patientName}>
                        {currentCalled?.patient_name || 'Aguardando...'}
                    </div>

                    {currentCalled && (
                        <div className={styles.doctorHighlight}>
                            <div className={styles.doctorLabel}>Atendimento com</div>
                            <div className={styles.doctorValue}>
                                Dr. {currentCalled.doctor_name?.split(' ')[0] || 'Plantonista'}
                                {currentCalled.doctor_specialty && (
                                    <span className={styles.specialtyTag}> — {currentCalled.doctor_specialty}</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer / Side Grid: Next Up */}
            <section className={styles.nextUpSection}>
                <div className={styles.nextLabel}>Próximos da Fila</div>
                <div className={styles.nextGrid}>
                    {waiting.map(item => (
                        <div key={item.id} className={styles.nextItem}>
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
                                        <Star fill="currentColor" size={16} />
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                    {waiting.length === 0 && (
                        <div className={styles.emptyState}>
                            Nenhum paciente aguardando no momento.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
