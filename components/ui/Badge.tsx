import React from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'waiting' | 'called' | 'in_service' | 'done' | 'danger' | 'info' | 'success' | 'secondary';
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'info',
    className = ''
}) => {
    return (
        <span className={`${styles.badge} ${styles[variant]} ${className}`}>
            {children}
        </span>
    );
};
