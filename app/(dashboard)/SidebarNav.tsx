'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './layout.module.css';

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    target?: string;
}

interface NavCategory {
    title: string;
    items: NavItem[];
}

export default function SidebarNav({ categories }: { categories: NavCategory[] }) {
    const pathname = usePathname();

    return (
        <div className={styles.navContent}>
            {categories.map((category) => (
                <nav key={category.title} className={styles.navSection}>
                    <h3 className={styles.navTitle}>{category.title}</h3>
                    <div className={styles.navGroup}>
                        {category.items.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    target={item.target}
                                    className={`${styles.navLink} ${isActive ? styles.activeLink : ''}`}
                                >
                                    <item.icon size={18} className={styles.navIcon} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            ))}
        </div>
    );
}
