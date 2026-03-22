'use client';

import { useCallback } from 'react';
import ServiceCatalog from '@/features/financial/components/ServiceCatalog';
import type { FinancialService } from '@/features/financial/types';

interface ServiceCatalogClientProps {
    initialServices: FinancialService[];
}

export default function ServiceCatalogClient({ initialServices }: ServiceCatalogClientProps) {
    const refresh = useCallback(() => {
        window.location.reload();
    }, []);

    return (
        <ServiceCatalog
            services={initialServices}
            onRefresh={refresh}
        />
    );
}
