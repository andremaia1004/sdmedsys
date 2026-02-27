import TVBoard from '@/features/queue/components/TVBoard';
import { fetchTVQueueAction } from '@/app/actions/queue';
import { fetchPublicSettingsAction } from '@/app/actions/admin';
import { QueueItemWithPatient } from '@/features/queue/types';

export const dynamic = 'force-dynamic';

export default async function TVPage({ searchParams }: { searchParams: { doctorId?: string } }) {
    let items: QueueItemWithPatient[] = [];
    let settings = null;

    try {
        const [fetchedItems, fetchedSettings] = await Promise.all([
            fetchTVQueueAction(searchParams.doctorId),
            fetchPublicSettingsAction()
        ]);
        items = fetchedItems || [];
        settings = fetchedSettings;
    } catch (error) {
        console.error('TVPage Error:', error);
    }

    return (
        <TVBoard
            items={items}
            clinicName={settings?.clinicName}
            logoUrl={settings?.logoUrl}
            refreshSeconds={settings?.tvRefreshSeconds || 30}
        />
    );
}
