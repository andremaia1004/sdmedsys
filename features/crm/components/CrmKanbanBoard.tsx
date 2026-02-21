'use client';

import React, { useState, useEffect } from 'react';
import { CrmCard, CrmStage } from '../types';
import { moveCrmCardAction, updateCrmNotesAction } from '../actions';
import { CrmColumn } from './CrmColumn';
import { CrmCardEditModal } from './CrmCardEditModal';
import styles from './CrmKanbanBoard.module.css';
import { useToast } from '@/components/ui/Toast';

const COLUMNS: { id: CrmStage; title: string }[] = [
    { id: 'lead', title: 'Leads Novos' },
    { id: 'scheduled', title: 'Consulta Agendada' },
    { id: 'in_treatment', title: 'Em Tratamento' },
    { id: 'awaiting_exams', title: 'Aguardando Exames' },
    { id: 'pending_return', title: 'Retorno Pendente' },
    { id: 'inactive', title: 'Inativo / Perdido' }
];

interface Props {
    initialCards: CrmCard[];
}

export function CrmKanbanBoard({ initialCards }: Props) {
    const [cards, setCards] = useState<CrmCard[]>(initialCards);
    const [editingCard, setEditingCard] = useState<CrmCard | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        setCards(initialCards);
    }, [initialCards]);

    const handleDragStart = (e: React.DragEvent, cardId: string) => {
        e.dataTransfer.setData('cardId', cardId);
        e.dataTransfer.effectAllowed = 'move';

        setTimeout(() => {
            const el = document.getElementById(`crm-card-${cardId}`);
            if (el) el.classList.add(styles.cardDragging);
        }, 0);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetStage: CrmStage) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('cardId');
        if (!cardId) return;

        const el = document.getElementById(`crm-card-${cardId}`);
        if (el) el.classList.remove(styles.cardDragging);

        const cardToMove = cards.find(c => c.id === cardId);
        if (!cardToMove || cardToMove.stage === targetStage) return;

        const previousCards = [...cards];
        const updatedCards = cards.map(c =>
            c.id === cardId ? { ...c, stage: targetStage, moved_at: new Date().toISOString() } : c
        );
        setCards(updatedCards);

        try {
            const res = await moveCrmCardAction(cardId, targetStage, 0); // Always puts at top (0) for now
            if (!res.success) {
                setCards(previousCards);
                showToast('error', res.error || 'Erro ao mover card');
            }
        } catch (error) {
            setCards(previousCards);
            showToast('error', 'Erro ao processar requisição');
        }
    };

    const handleDragEnd = (e: React.DragEvent) => {
        document.querySelectorAll(`.${styles.cardDragging}`).forEach(el => el.classList.remove(styles.cardDragging));
    };

    const handleSaveNotes = async (id: string, notes: string) => {
        const previousCards = [...cards];
        setCards(cards.map(c => c.id === id ? { ...c, notes } : c));

        try {
            const res = await updateCrmNotesAction(id, notes);
            if (res.success) {
                showToast('success', 'Observações salvas!');
            } else {
                setCards(previousCards);
                showToast('error', res.error || 'Erro ao salvar anotação');
            }
        } catch (error) {
            setCards(previousCards);
            showToast('error', 'Erro inesperado');
        }
    };

    return (
        <div className={styles.board} onDragEnd={handleDragEnd}>
            {COLUMNS.map(col => (
                <CrmColumn
                    key={col.id}
                    title={col.title}
                    stage={col.id}
                    cards={cards.filter(c => c.stage === col.id).sort((a, b) => {
                        if (a.position !== b.position) return a.position - b.position;
                        return new Date(b.moved_at).getTime() - new Date(a.moved_at).getTime();
                    })}
                    onEditCard={setEditingCard}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                />
            ))}

            <CrmCardEditModal
                card={editingCard}
                onClose={() => setEditingCard(null)}
                onSave={handleSaveNotes}
            />
        </div>
    );
}
