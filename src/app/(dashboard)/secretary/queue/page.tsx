import QueuePanel from '@/features/queue/components/QueuePanel';
import { fetchQueueAction } from '@/app/actions/queue';

export default async function SecretaryQueuePage() {
    const items = await fetchQueueAction(); // Fetch all

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Queue Control</h1>
            <QueuePanel items={items} />
        </div>
    );
}
