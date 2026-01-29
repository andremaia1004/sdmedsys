import React from 'react';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    className = '',
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    children,
    ...props
}) => {
    const classes = [
        styles.button,
        styles[variant],
        styles[size],
        fullWidth ? styles.fullWidth : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <button className={classes} {...props}>
            {children}
        </button>
    );
};
