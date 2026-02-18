'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { TimelineEvent, TimelineFilters } from '../types';
import { getClinicalTimelineAction } from '../actions';

interface PatientTimelineProps {
    patientId: string;
}

export const PatientTimeline: React.FC<PatientTimelineProps> = ({ patientId }) => {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    // const [filters, setFilters] = useState<TimelineFilters>({});
    const [filters] = useState<TimelineFilters>({});

    const loadData = useCallback(async (reset = false) => {
        setLoading(true);
        const currentPage = reset ? 1 : page;

        const response = await getClinicalTimelineAction(patientId, currentPage, 20, filters);

        if (response.error) {
            setError(response.error);
            setLoading(false);
            return;
        }

        if (response.data) {
            if (reset) {
                setEvents(response.data.data);
            } else {
                setEvents(prev => [...prev, ...response.data!.data]);
            }
            setHasMore(response.data.hasMore);
            if (reset) setPage(2);
            else setPage(prev => prev + 1);
        }
        setLoading(false);
    }, [patientId, page, filters]);

    // Initial load
    useEffect(() => {
        // Reset and load on mount or filter change
        setPage(1);
        loadData(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId, filters]);
    // Note: 'filters' object dependency might cause loops if not memoized, 
    // but here we rely on the parent or internal setFilters to stable objects? 
    // Actually standard hook hygiene: deep comparison or primitive breakdown is better.
    // For MVP stage 03A, we assume filters update infrequently.

    const handleLoadMore = () => {
        loadData(false);
    };

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded border border-red-200">
                <h3 className="font-bold">Acesso Negado ou Erro</h3>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-4">
            {/* Filters Header (MVP) */}
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <h3 className="font-semibold text-gray-700">Histórico Clínico</h3>
                {/* Future: Add Filter Controls Here */}
                <div className="text-sm text-gray-500">
                    Filtros: {Object.keys(filters).length ? 'Ativos' : 'Nenhum'}
                </div>
            </div>

            {/* Timeline List */}
            <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
                {events.length === 0 && !loading && (
                    <div className="ml-6 text-gray-500 italic">Nenhum evento registrado.</div>
                )}

                {events.map((event) => (
                    <div key={event.id} className="mb-8 ml-6 relative">
                        {/* Icon/Dot */}
                        <div className="absolute -left-9 mt-1.5 w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
                            {/* Simple Icon placeholder */}
                            <span className="text-white text-xs">
                                {event.eventType === 'CONSULTATION' ? 'C' : 'E'}
                            </span>
                        </div>

                        {/* Content */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <h4 className="text-lg font-semibold text-gray-800">{event.title}</h4>
                                <span className="text-xs text-gray-400">
                                    {new Date(event.occurredAt).toLocaleDateString()} {new Date(event.occurredAt).toLocaleTimeString()}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{event.summary}</p>
                            {event.doctorUserId && (
                                <p className="text-xs text-gray-400 mt-2">Dr. {event.doctorUserId}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Load More */}
            {loading && <div className="text-center py-4 text-gray-500">Carregando...</div>}

            {!loading && hasMore && (
                <button
                    onClick={handleLoadMore}
                    className="w-full py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                    Carregar Mais
                </button>
            )}
        </div>
    );
};
