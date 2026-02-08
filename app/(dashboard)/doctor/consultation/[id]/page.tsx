import ConsultationWorkspace from '@/features/consultation/components/ConsultationWorkspace';
import { getConsultationAction, getClinicalEntryAction, getPatientTimelineAction } from '@/features/consultation/actions';
import { PatientService } from '@/features/patients/service';
import { redirect } from 'next/navigation';

export default async function ConsultationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const consultation = await getConsultationAction(id);

    if (!consultation || consultation.finishedAt) {
        redirect('/doctor/queue');
    }

    // Fetch Patient Data for display
    const patient = await PatientService.findById(consultation.patientId);
    if (!patient) {
        redirect('/doctor/queue');
    }

    // Fetch existing clinical entry if any
    const entry = await getClinicalEntryAction(id);

    // Fetch historical timeline
    const timeline = await getPatientTimelineAction(consultation.patientId);

    return (
        <ConsultationWorkspace
            consultation={consultation}
            patient={patient}
            initialEntry={entry || undefined}
            timeline={timeline}
        />
    );
}
