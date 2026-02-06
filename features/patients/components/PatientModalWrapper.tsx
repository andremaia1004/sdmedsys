'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X, UserPlus } from 'lucide-react';
import PatientForm from './PatientForm';
import styles from '../styles/Patients.module.css';

interface PatientModalWrapperProps {
    canCreate: boolean;
}

export default function PatientModalWrapper({ canCreate }: PatientModalWrapperProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!canCreate) return null;

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                variant="primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
                <UserPlus size={18} />
                Novo Paciente
            </Button>

            {isOpen && (
                <div className={styles.modalOverlay} onClick={() => {
                    console.log('Overlay clicked');
                    // TEMPORARY DEBUG: Disable close on overlay click to isolate bug
                    // setIsOpen(false);
                }}>
                    <div
                        className={styles.modalCard}
                        onClick={(e) => {
                            console.log('Card clicked');
                            e.stopPropagation();
                        }}
                    >
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Cadastrar Novo Paciente</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className={styles.closeButton}
                                type="button"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.modalContent}>
                            <PatientForm onSuccess={() => {
                                console.log('PatientForm triggered onSuccess');
                                setIsOpen(false)
                            }} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
