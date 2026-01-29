import ConsultationWorkspace from '@/features/consultation/components/ConsultationWorkspace';
import { getConsultationAction } from '@/features/consultation/actions';
import { PatientService } from '@/features/patients/service';
import { redirect } from 'next/navigation';

export default async function ConsultationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const consultation = await getConsultationAction(id);

    if (!consultation || consultation.finishedAt) {
        redirect('/doctor/queue');
    }

    // Fetch Patient Name for display
    const patient = await PatientService.findById(consultation.patientId);
    const patientName = patient ? patient.name : 'Unknown Patient';

    return (
        <ConsultationWorkspace consultation={consultation} patientName={patientName} />
    );
}
