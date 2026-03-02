'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import styles from './layout.module.css';

interface LayoutShellProps {
    sidebar: React.ReactNode;
    topbarContent: React.ReactNode;
    children: React.ReactNode;
}

export default function LayoutShell({ sidebar, topbarContent, children }: LayoutShellProps) {
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const pathname = usePathname();

    // Close sidebar on navigation (mobile)
    const [prevPath, setPrevPath] = useState(pathname);
    if (pathname !== prevPath) {
        setPrevPath(pathname);
        if (isSidebarVisible) {
            setIsSidebarVisible(false);
        }
    }

    // Prevent scrolling when mobile menu is open
    useEffect(() => {
        if (isSidebarVisible) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isSidebarVisible]);

    const toggleSidebar = () => setIsSidebarVisible(!isSidebarVisible);

    return (
        <div className={`${styles.layout} ${isSidebarVisible ? styles.sidebarVisible : ''}`}>
            {/* Sidebar with visibility control handled via CSS class on parent + portal/absolute logic */}
            <div className={`${styles.sidebar} ${isSidebarVisible ? styles.sidebarVisible : styles.sidebarHidden}`}>
                {sidebar}
            </div>

            {/* Backdrop for mobile */}
            <div
                className={styles.overlay}
                onClick={() => setIsSidebarVisible(false)}
            />

            <div className={styles.mainArea}>
                <header className={styles.topbar}>
                    <button
                        className={styles.menuToggle}
                        onClick={toggleSidebar}
                        aria-label="Toggle Menu"
                    >
                        {isSidebarVisible ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    {topbarContent}
                </header>

                <main className={styles.content}>
                    {children}
                </main>
            </div>
        </div>
    );
}
