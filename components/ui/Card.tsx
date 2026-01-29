import React from 'react';
import styles from './Card.module.css';

interface CardProps {
    children: React.ReactNode;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    className?: string;
    style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
    children,
    header,
    footer,
    padding = 'md',
    className = '',
    style
}) => {
    return (
        <div className={`${styles.card} ${styles[padding]} ${className}`} style={style}>
            {header && <div className={styles.header}>{header}</div>}
            <div className={styles.content}>{children}</div>
            {footer && <div className={styles.footer}>{footer}</div>}
        </div>
    );
};
