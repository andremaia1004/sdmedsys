export type ActionResponse<T = void> = {
    success: boolean;
    data?: T;
    error?: string;
};

export function formatSuccess<T>(data?: T): ActionResponse<T> {
    return { success: true, data };
}

export function formatError(error: unknown): ActionResponse<never> {
    const message = error instanceof Error ? error.message : 'Erro inesperado. Tente novamente.';
    console.error('[ActionError]', error);
    return { success: false, error: message };
}
