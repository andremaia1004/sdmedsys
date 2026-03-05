import { SecretaryDashboardService } from '../features/secretary/service.dashboard';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'fs';

async function run() {
    const clinicId = '550e8400-e29b-41d4-a716-446655440000';
    const date = new Date().toISOString().split('T')[0];

    try {
        const data = await SecretaryDashboardService.getDailyDashboard(clinicId, date);
        const walkins = data.filter(d => d.appointment_status === 'ARRIVED');
        fs.writeFileSync('scripts/debug_out.json', JSON.stringify(walkins, null, 2));
        console.log("Walkins found:", walkins.length);
    } catch (e) {
        console.error(e);
    }
}
run();
