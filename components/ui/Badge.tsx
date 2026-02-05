import React from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'waiting' | 'called' | 'in_service' | 'done' | 'danger' | 'info' | 'success' | 'secondary';
    className?: string;
    style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'info',
    className = '',
    style
}) => {
    return (
        <span className={`${styles.badge} ${styles[variant]} ${className}`} style={style}>
            {children}
        </span>
    );
};
