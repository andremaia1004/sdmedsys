import TVBoard from '@/features/queue/components/TVBoard';
import { fetchTVQueueAction } from '@/app/actions/queue';

export default async function TVPage() {
    const items = await fetchTVQueueAction();
    return (
        <TVBoard items={items || []} />
    );
}
