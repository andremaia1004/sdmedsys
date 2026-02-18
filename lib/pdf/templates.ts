import { createBasePDF, addFooter, DocumentHeader, PatientInfo, DoctorInfo } from './generator';

export interface PrescriptionData {
    header: DocumentHeader;
    patient: PatientInfo;
    doctor: DoctorInfo;
    content: string; // Conduta / Prescrição
    observations?: string;
    date: string;
    metadata?: {
        consultationId: string;
        patientId: string;
        doctorId: string;
        clinicId: string;
    };
}

export interface CertificateData {
    header: DocumentHeader;
    patient: PatientInfo;
    doctor: DoctorInfo;
    days: number;
    cid?: string;
    date: string;
    startTime?: string;
    metadata?: {
        consultationId: string;
        patientId: string;
        doctorId: string;
        clinicId: string;
    };
}

export interface ReportData {
    header: DocumentHeader;
    patient: PatientInfo;
    doctor: DoctorInfo;
    content: string; // Detailed clinical report
    date: string;
    metadata?: {
        consultationId: string;
        patientId: string;
        doctorId: string;
        clinicId: string;
    };
}

export async function generatePrescription(data: PrescriptionData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = createBasePDF(data.header);
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title
        doc.fontSize(18).text('RECEITUÁRIO MÉDICO', { align: 'center', underline: true });
        doc.moveDown(2);

        // Patient Info
        doc.fontSize(11).text(`Paciente: `, { continued: true }).font('Helvetica-Bold').text(data.patient.name);
        doc.font('Helvetica');
        if (data.patient.document) {
            doc.text(`CPF/Doc: ${data.patient.document}`);
        }
        doc.moveDown(2);

        // Prescription Content
        doc.fontSize(12).font('Helvetica-Bold').text('PRESCRIÇÃO / CONDUTA:');
        doc.font('Helvetica').fontSize(11).text(data.content, {
            align: 'justify',
            lineGap: 5
        });

        if (data.observations) {
            doc.moveDown(1);
            doc.fontSize(11).font('Helvetica-Bold').text('Observações:');
            doc.font('Helvetica').text(data.observations);
        }

        // Date
        doc.moveDown(4);
        doc.fontSize(10).text(`Data: ${data.date}`, { align: 'right' });

        // Footer
        addFooter(doc, data.doctor);

        doc.end();
    });
}

export async function generateCertificate(data: CertificateData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = createBasePDF(data.header);
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title
        doc.fontSize(18).text('ATESTADO MÉDICO', { align: 'center', underline: true });
        doc.moveDown(2);

        // Content
        const text = `Atesto para os devidos fins que o(a) Sr(a). ${data.patient.name}${data.patient.document ? `, portador(a) do documento ${data.patient.document},` : ''} foi atendido(a) nesta unidade de saúde em ${data.date}${data.startTime ? ` às ${data.startTime}` : ''}.`;

        doc.fontSize(12).text(text, { align: 'justify', lineGap: 8 });
        doc.moveDown(1);

        const duration = data.days > 0
            ? `O(A) mesmo(a) necessita de ${data.days} dia(s) de afastamento de suas atividades laborais a partir desta data.`
            : `O(A) mesmo(a) compareceu à consulta no período acima mencionado.`;

        doc.text(duration, { align: 'justify', lineGap: 8 });

        if (data.cid) {
            doc.moveDown(1);
            doc.fontSize(11).text(`CID: ${data.cid}`);
        }

        // Date
        doc.moveDown(4);
        doc.fontSize(10).text(`${data.date}`, { align: 'right' });

        // Footer
        addFooter(doc, data.doctor);

        doc.end();
    });
}

export async function generateReport(data: ReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = createBasePDF(data.header);
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title
        doc.fontSize(18).text('LAUDO MÉDICO', { align: 'center', underline: true });
        doc.moveDown(2);

        // Patient Info
        doc.fontSize(11).text(`Paciente: `, { continued: true }).font('Helvetica-Bold').text(data.patient.name);
        doc.font('Helvetica');
        if (data.patient.document) {
            doc.text(`CPF/Doc: ${data.patient.document}`);
        }
        doc.moveDown(2);

        // Content
        doc.fontSize(12).font('Helvetica-Bold').text('DESCRIÇÃO DO LAUDO / PARECER:');
        doc.font('Helvetica').fontSize(11).text(data.content, {
            align: 'justify',
            lineGap: 5
        });

        // Date
        doc.moveDown(4);
        doc.fontSize(10).text(`Data: ${data.date}`, { align: 'right' });

        // Footer
        addFooter(doc, data.doctor);

        doc.end();
    });
}


export interface ExamRequestData {
    header: DocumentHeader;
    patient: PatientInfo;
    doctor: DoctorInfo;
    examList: string;
    justification?: string;
    date: string;
    metadata?: {
        consultationId: string;
        patientId: string;
        doctorId: string;
        clinicId: string;
    };
}

export async function generateExamRequest(data: ExamRequestData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = createBasePDF(data.header);
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title
        doc.fontSize(18).text('SOLICITAÇÃO DE EXAMES', { align: 'center', underline: true });
        doc.moveDown(2);

        // Patient Info
        doc.fontSize(11).text(`Paciente: `, { continued: true }).font('Helvetica-Bold').text(data.patient.name);
        doc.font('Helvetica');
        if (data.patient.document) {
            doc.text(`CPF/Doc: ${data.patient.document}`);
        }
        doc.moveDown(2);

        // Content
        doc.fontSize(12).font('Helvetica-Bold').text('EXAMES SOLICITADOS:');
        doc.font('Helvetica').fontSize(11).text(data.examList, {
            align: 'justify',
            lineGap: 5
        });

        if (data.justification) {
            doc.moveDown(1);
            doc.fontSize(11).font('Helvetica-Bold').text('Indicação Clínica / Justificativa:');
            doc.font('Helvetica').text(data.justification);
        }

        // Date
        doc.moveDown(4);
        doc.fontSize(10).text(`Data: ${data.date}`, { align: 'right' });

        // Footer
        addFooter(doc, data.doctor);

        doc.end();
    });
}
