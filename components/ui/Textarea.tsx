import React from 'react';
import styles from './Input.module.css';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
    label,
    error,
    fullWidth,
    className = '',
    ...props
}) => {
    return (
        <div className={`${styles.container} ${fullWidth ? styles.fullWidth : ''}`}>
            {label && <label className={styles.label}>{label}</label>}
            <textarea
                className={`${styles.input} ${error ? styles.errorInput : ''} ${className}`}
                style={{ minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }}
                {...props}
            />
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
};
