import React from 'react';
import { CrmCard } from '../types';
import styles from './CrmKanbanBoard.module.css';
import { Edit2, Clock, Stethoscope } from 'lucide-react';

interface Props {
    card: CrmCard;
    onEdit: (card: CrmCard) => void;
    onDragStart: (e: React.DragEvent, cardId: string) => void;
}

export function CrmPatientCard({ card, onEdit, onDragStart }: Props) {
    const timeSinceMove = Math.floor((new Date().getTime() - new Date(card.moved_at).getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div
            id={`crm-card-${card.id}`}
            className={styles.card}
            draggable
            onDragStart={(e) => onDragStart(e, card.id)}
        >
            <div className={styles.cardHeader}>
                <div>
                    <h4 className={styles.patientName}>{card.patient_name}</h4>
                    {card.doctor_name && (
                        <div className={styles.doctorName}>
                            <Stethoscope size={12} /> {card.doctor_name}
                        </div>
                    )}
                </div>
                <button
                    className={styles.editBtn}
                    onClick={() => onEdit(card)}
                    title="Editar Notas"
                >
                    <Edit2 size={14} />
                </button>
            </div>

            {card.notes && (
                <div className={styles.notesPreview}>
                    {card.notes}
                </div>
            )}

            <div className={styles.cardFooter}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    {timeSinceMove === 0 ? 'Hoje' : `${timeSinceMove}d atrás`}
                </span>
            </div>
        </div>
    );
}
