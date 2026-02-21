import React, { useState } from 'react';
import { CrmCard, CrmStage } from '../types';
import { CrmPatientCard } from './CrmPatientCard';
import styles from './CrmKanbanBoard.module.css';

interface Props {
    title: string;
    stage: CrmStage;
    cards: CrmCard[];
    onEditCard: (card: CrmCard) => void;
    onDragStart: (e: React.DragEvent, cardId: string) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, targetStage: CrmStage) => void;
}

export function CrmColumn({ title, stage, cards, onEditCard, onDragStart, onDragOver, onDrop }: Props) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        onDragOver(e);
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        setIsDragOver(false);
        onDrop(e, stage);
    };

    return (
        <div
            className={`${styles.column} ${isDragOver ? styles.dragOver : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className={styles.columnHeader}>
                <span>{title}</span>
                <span className={styles.badge}>{cards.length}</span>
            </div>
            <div className={styles.columnContent}>
                {cards.map(card => (
                    <CrmPatientCard
                        key={card.id}
                        card={card}
                        onEdit={onEditCard}
                        onDragStart={onDragStart}
                    />
                ))}
            </div>
        </div>
    );
}
