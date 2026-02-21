import PDFDocument from 'pdfkit';

interface PrescriptionData {
    patientName: string;
    doctorName: string;
    medications: string; // Rich text or simple text
    instructions: string;
    date: string;
}

export class PdfService {
    private static drawHeader(doc: PDFKit.PDFDocument, title: string, doctorName: string, crm?: string) {
        // SDMED Logo/Title area
        doc.fontSize(22).fillColor('#1e40af').text('SDMED SYSTEM', { align: 'center', characterSpacing: 1 });
        doc.fontSize(10).fillColor('#64748b').text('Gestão Médica Inteligente', { align: 'center' });
        doc.moveDown(1.5);

        // Document Title
        doc.fontSize(16).fillColor('#1e293b').text(title, { align: 'center', underline: true });
        doc.moveDown(1.5);

        // Doctor Header Info
        doc.fontSize(11).fillColor('#334155').text(`Dr(a). ${doctorName}`, { align: 'right' });
        if (crm) {
            doc.text(`CRM: ${crm}`, { align: 'right' });
        }
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'right' });

        doc.moveTo(50, doc.y + 10).lineTo(545, doc.y + 10).strokeColor('#e2e8f0').lineWidth(1).stroke();
        doc.moveDown(2.5);
    }

    private static drawFooter(doc: PDFKit.PDFDocument, doctorName: string, crm?: string) {
        const bottom = doc.page.height - 120;

        // Signature Line
        doc.moveTo(150, bottom).lineTo(450, bottom).strokeColor('#94a3b8').lineWidth(0.5).stroke();
        doc.fontSize(10).fillColor('#475569').text(`Dr(a). ${doctorName}`, 50, bottom + 10, { align: 'center', width: 500 });
        if (crm) {
            doc.text(`CRM: ${crm}`, { align: 'center', width: 500 });
        }

        doc.fontSize(8).fillColor('#94a3b8').text('Documento eletrônico gerado pelo SDMED System • Validação via QR Code ou Assinatura Digital', 50, doc.page.height - 40, { align: 'center', width: 500 });
    }

    static async generatePrescription(data: PrescriptionData & { crm?: string }): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks: Buffer[] = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            this.drawHeader(doc, 'RECEITUÁRIO MÉDICO', data.doctorName, data.crm);

            // Patient Area
            doc.fontSize(13).fillColor('#1e293b').text('PACIENTE:', { continued: true });
            doc.fontSize(13).font('Helvetica-Bold').text(` ${data.patientName}`);
            doc.moveDown(2);

            // Content Area - Medications
            doc.font('Helvetica-Bold').fontSize(12).text('USO EXTERNO/INTERNO:', { underline: true });
            doc.moveDown(1);
            doc.font('Helvetica').fontSize(12).fillColor('#334155').text(data.medications, {
                align: 'justify',
                lineGap: 6
            });

            if (data.instructions) {
                doc.moveDown(2);
                doc.font('Helvetica-Bold').fontSize(12).text('ORIENTAÇÕES:', { underline: true });
                doc.moveDown(0.5);
                doc.font('Helvetica').fontSize(11).text(data.instructions, { align: 'justify' });
            }

            this.drawFooter(doc, data.doctorName, data.crm);
            doc.end();
        });
    }

    static async generateCertificate(data: { patientName: string; doctorName: string; date: string; days?: number; cid?: string; observation?: string; crm?: string }): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks: Buffer[] = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            this.drawHeader(doc, 'ATESTADO MÉDICO', data.doctorName, data.crm);

            doc.fontSize(12).fillColor('#334155').text(`Atesto para os devidos fins que o(a) Sr(a). ${data.patientName}, foi atendido(a) nesta unidade médica nesta data.`, { align: 'justify', lineGap: 8 });
            doc.moveDown(1);

            if (data.days) {
                doc.text(`O(A) mesmo(a) necessita de ${data.days} (${data.days === 1 ? 'um dia' : 'dias'}) de afastamento de suas atividades laborais e/ou escolares a partir desta data, por motivo de tratamento de saúde.`, { align: 'justify', lineGap: 8 });
            }

            if (data.cid) {
                doc.moveDown(1.5);
                doc.font('Helvetica-Bold').text(`CID-10: ${data.cid}`);
            }

            if (data.observation) {
                doc.moveDown(1.5);
                doc.font('Helvetica-Bold').text('Observações:');
                doc.font('Helvetica').text(data.observation, { align: 'justify' });
            }

            this.drawFooter(doc, data.doctorName, data.crm);
            doc.end();
        });
    }

    static async generateReport(data: { patientName: string; doctorName: string; date: string; content: string; crm?: string }): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks: Buffer[] = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            this.drawHeader(doc, 'LAUDO MÉDICO', data.doctorName, data.crm);

            doc.fontSize(12).font('Helvetica-Bold').text('PACIENTE: ', { continued: true });
            doc.font('Helvetica').text(data.patientName);
            doc.moveDown(1.5);

            doc.font('Helvetica-Bold').text('RELATÓRIO CLÍNICO:');
            doc.moveDown(0.5);
            doc.font('Helvetica').fillColor('#334155').text(data.content, { align: 'justify', lineGap: 6 });

            this.drawFooter(doc, data.doctorName, data.crm);
            doc.end();
        });
    }

    static async generateExamRequest(data: { patientName: string; doctorName: string; date: string; examList: string; justification?: string; crm?: string }): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks: Buffer[] = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            this.drawHeader(doc, 'SOLICITAÇÃO DE EXAMES', data.doctorName, data.crm);

            doc.fontSize(12).font('Helvetica-Bold').text('PACIENTE: ', { continued: true });
            doc.font('Helvetica').text(data.patientName);
            doc.moveDown(2);

            doc.font('Helvetica-Bold').text('EXAMES SOLICITADOS:');
            doc.moveDown(0.5);
            doc.font('Helvetica').fillColor('#334155').text(data.examList, { align: 'justify', lineGap: 6 });

            if (data.justification) {
                doc.moveDown(2);
                doc.font('Helvetica-Bold').text('INDICAÇÃO CLÍNICA / JUSTIFICATIVA:');
                doc.moveDown(0.5);
                doc.font('Helvetica').text(data.justification, { align: 'justify' });
            }

            this.drawFooter(doc, data.doctorName, data.crm);
            doc.end();
        });
    }
    static async generateReferral(data: { patientName: string; doctorName: string; date: string; specialty: string; reason: string; clinicalSummary: string; observation?: string; crm?: string }): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks: Buffer[] = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            this.drawHeader(doc, 'ENCAMINHAMENTO MÉDICO', data.doctorName, data.crm);

            doc.fontSize(12).font('Helvetica-Bold').text('AO(À) REFERENCIADO(A): ', { continued: true });
            doc.font('Helvetica').text(data.specialty);
            doc.moveDown(1.5);

            doc.font('Helvetica-Bold').text('PACIENTE: ', { continued: true });
            doc.font('Helvetica').text(data.patientName);
            doc.moveDown(2);

            doc.font('Helvetica-Bold').text('MOTIVO / INDICAÇÃO:');
            doc.moveDown(0.5);
            doc.font('Helvetica').fillColor('#334155').text(data.reason, { align: 'justify', lineGap: 6 });
            doc.moveDown(1.5);

            doc.font('Helvetica-Bold').fillColor('#000').text('RESUMO CLÍNICO:');
            doc.moveDown(0.5);
            doc.font('Helvetica').fillColor('#334155').text(data.clinicalSummary, { align: 'justify', lineGap: 6 });
            doc.moveDown(1.5);

            if (data.observation) {
                doc.font('Helvetica-Bold').fillColor('#000').text('OBSERVAÇÕES:');
                doc.moveDown(0.5);
                doc.font('Helvetica').fillColor('#334155').text(data.observation, { align: 'justify', lineGap: 6 });
            }

            this.drawFooter(doc, data.doctorName, data.crm);
            doc.end();
        });
    }
}
