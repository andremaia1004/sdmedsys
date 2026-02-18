import React from 'react';
import { Patient } from '../types';
import styles from '../styles/Patients.module.css';

interface PatientHeaderProps {
    patient: Patient;
    lastConsultationDate?: string | null;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({ patient, lastConsultationDate }) => {
    // Utility for Age
    const getAge = (birthDate: string | undefined) => {
        if (!birthDate) return 'N/A';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return `${age} anos`;
    };

    // Utility for CPF Mask (***.123.***-**)
    const maskCPF = (cpf: string | undefined) => {
        if (!cpf) return 'N/A';
        const clean = cpf.replace(/\D/g, '');
        if (clean.length !== 11) return cpf; // Return original if not 11 docs
        return `***.${clean.substring(3, 6)}.***-${clean.substring(9, 11)}`;
    };

    // Utility for Phone Format
    const formatPhone = (phone: string | undefined) => {
        if (!phone) return 'N/A';
        const clean = phone.replace(/\D/g, '');
        if (clean.length === 11) {
            return `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7)}`;
        }
        if (clean.length === 10) {
            return `(${clean.substring(0, 2)}) ${clean.substring(2, 6)}-${clean.substring(6)}`;
        }
        return phone;
    };

    return (
        <div className={styles.patientHeader}>
            <div className={styles.headerMain}>
                <div className={styles.avatarPlaceholder}>
                    {patient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h1 className={styles.patientName}>{patient.name}</h1>
                    <div className={styles.patientMeta}>
                        <span title="Idade">🎂 {getAge(patient.birthDate)}</span>
                        <span className={styles.separator}>•</span>
                        <span title="CPF">🆔 {maskCPF(patient.document)}</span>
                        <span className={styles.separator}>•</span>
                        <span title="Telefone">📱 {formatPhone(patient.phone)}</span>
                    </div>
                </div>
            </div>

            {lastConsultationDate && (
                <div className={styles.lastConsultation}>
                    <span className={styles.label}>Última Consulta</span>
                    <span className={styles.date}>
                        {new Date(lastConsultationDate).toLocaleDateString('pt-BR')}
                    </span>
                </div>
            )}
        </div>
    );
};
