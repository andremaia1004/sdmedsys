import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testUpdate() {
    // Import updateSettingsAction
    const { updateSettingsAction } = await import('./app/actions/admin');

    console.log('Testing updateSettingsAction...');
    try {
        const result = await updateSettingsAction({
            clinicName: 'CLINICA SDMED TEST'
        });
        console.log('Result:', result);
    } catch (e) {
        console.error('Action failed:', e);
    }
}

testUpdate().catch(console.error);
