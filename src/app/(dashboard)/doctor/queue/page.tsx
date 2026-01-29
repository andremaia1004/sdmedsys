import DoctorWorklist from '@/features/consultation/components/DoctorWorklist';
import { fetchQueueAction } from '@/app/actions/queue';

export default async function DoctorQueuePage() {
    // Mock Doctor ID
    const myDoctorId = 'doc';
    const items = await fetchQueueAction(myDoctorId);

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>My Worklist</h1>
            <DoctorWorklist items={items} />
        </div>
    );
}
