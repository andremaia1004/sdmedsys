export interface ActionState {
    error?: string;
    success?: boolean;
    message?: string;
    [key: string]: unknown;
}
