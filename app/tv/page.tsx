import TVBoard from '@/features/queue/components/TVBoard';
import { QueueService } from '@/features/queue/service';
import { SettingsService } from '@/features/admin/settings/service';

export const dynamic = 'force-dynamic';

export default async function TVPage() {
    // Avoid calling Server Actions during SSR. Call Services directly for better stability.
    let items = [];
    let settings = null;

    try {
        const [fetchedItems, fetchedSettings] = await Promise.all([
            QueueService.getTVList(),
            SettingsService.get()
        ]);
        items = fetchedItems || [];
        settings = fetchedSettings;
    } catch (error) {
        console.error('TVPage SSR Error:', error);
        // Fallbacks are already handled by SettingsService.get() if it's robust
    }

    return (
        <TVBoard
            items={items}
            clinicName={settings?.clinicName || 'SDMED SYS'}
            refreshSeconds={settings?.tvRefreshSeconds || 30}
        />
    );
}
