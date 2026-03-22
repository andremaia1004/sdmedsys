import { requireRole } from '@/lib/session';
import { getAllServices } from '@/features/financial/service';
import ServiceCatalogClient from './ServiceCatalogClient';
import styles from '@/features/financial/components/Financial.module.css';

export default async function ServiceCatalogPage() {
    await requireRole(['ADMIN']);
    const services = await getAllServices();

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <div>
                    <h1>Catálogo de Serviços</h1>
                    <p>Gerencie os serviços e preços padrão da clínica</p>
                </div>
            </div>

            <ServiceCatalogClient initialServices={services} />
        </div>
    );
}
