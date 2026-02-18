import React from 'react';
import styles from '../styles/Patients.module.css';

interface StateProps {
    message?: string;
    action?: React.ReactNode;
}

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Carregando...' }) => (
    <div className={styles.stateContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.stateMessage}>{message}</p>
    </div>
);

export const EmptyState: React.FC<StateProps> = ({ message = 'Nenhum item encontrado.', action }) => (
    <div className={styles.stateContainer}>
        <div className={styles.emptyIcon}>📂</div>
        <p className={styles.stateMessage}>{message}</p>
        {action && <div className={styles.stateAction}>{action}</div>}
    </div>
);

export const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({ message = 'Ocorreu um erro.', onRetry }) => (
    <div className={styles.stateContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <p className={styles.stateMessage}>{message}</p>
        {onRetry && (
            <button onClick={onRetry} className={styles.retryButton}>
                Tentar Novamente
            </button>
        )}
    </div>
);

export const NoPermissionState: React.FC<{ message?: string }> = ({ message = 'Você não tem permissão para visualizar este conteúdo.' }) => (
    <div className={styles.stateContainer}>
        <div className={styles.lockIcon}>🔒</div>
        <p className={styles.stateMessage}>{message}</p>
    </div>
);
