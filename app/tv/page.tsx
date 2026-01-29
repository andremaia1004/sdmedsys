import TVBoard from '@/features/queue/components/TVBoard';
import { fetchTVQueueAction } from '@/app/actions/queue';
import { fetchSettingsAction } from '@/app/actions/admin';

export const dynamic = 'force-dynamic';

export default async function TVPage() {
    const [items, settings] = await Promise.all([
        fetchTVQueueAction(),
        fetchSettingsAction()
    ]);

    return (
        <TVBoard items={items || []} clinicName={settings?.clinicName} />
    );
}
