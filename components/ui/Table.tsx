import React from 'react';
import styles from './Table.module.css';

interface TableProps {
    headers: string[];
    children: React.ReactNode;
    className?: string;
    stickyHeader?: boolean;
}

export const Table: React.FC<TableProps> = ({
    headers,
    children,
    className = '',
    stickyHeader = false
}) => {
    return (
        <div className={`${styles.container} ${className}`}>
            <table className={`${styles.table} ${stickyHeader ? styles.sticky : ''}`}>
                <thead>
                    <tr>
                        {headers.map((header, i) => (
                            <th key={i}>{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>{children}</tbody>
            </table>
        </div>
    );
};
