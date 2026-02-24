import PDFDocument from 'pdfkit';
import path from 'path';

// Standard fonts for PDFKit can have issues in Next.js environment (AFM files missing)
// We use bundled TTF fonts to ensure stability across all environments.
const FONT_REGULAR = path.join(process.cwd(), 'features', 'documents', 'fonts', 'Regular.ttf');
const FONT_BOLD = path.join(process.cwd(), 'features', 'documents', 'fonts', 'Bold.ttf');

export interface PrescriptionData {
    patientName: string;
    doctorName: string;
    crm?: string;
    medications: string;
    instructions: string;
    date: string;
}

export interface CertificateData {
    patientName: string;
    doctorName: string;
    crm?: string;
    date: string;
    days: number;
    cid?: string;
    observation?: string;
}

export interface ReportData {
    patientName: string;
    doctorName: string;
    crm?: string;
    date: string;
    content: string;
}

export interface ExamRequestData {
    patientName: string;
    doctorName: string;
    crm?: string;
    date: string;
    examList: string;
    justification?: string;
}

export interface ReferralData {
    patientName: string;
    doctorName: string;
    crm?: string;
    date: string;
    specialty: string;
    reason: string;
    clinicalSummary?: string;
    observation?: string;
}

export class PdfService {
    private static drawHeader(doc: PDFKit.PDFDocument, title: string, doctorName: string, crm?: string) {
        // Logo / Branding Area (Arial fonts are very similar to Helvetica)
        doc.fillColor('#0f172a').font(FONT_BOLD).fontSize(20).text('SDMED', 50, 45, { continued: true });
        doc.fillColor('#3b82f6').font(FONT_BOLD).text('SYS');

        doc.fillColor('#64748b').font(FONT_REGULAR).fontSize(8)
            .text('SISTEMA DE GESTÃO MÉDICA INTELIGENTE', 50, 68);

        // Header Decoration
        doc.moveTo(50, 85).lineTo(545, 85).lineWidth(1).strokeColor('#e2e8f0').stroke();

        // Document Title
        doc.fillColor('#1e293b').font(FONT_BOLD).fontSize(16).text(title, 50, 105, { align: 'center' });
        doc.moveDown(1.5);

        // Header Metadata (Doctor Info)
        const currentY = doc.y;
        doc.fillColor('#475569').font(FONT_REGULAR).fontSize(10);
        doc.text(`Profissional: ${doctorName}`, 300, 140, { align: 'right', width: 245 });
        if (crm) {
            doc.text(`CRM: ${crm}`, 300, 155, { align: 'right', width: 245 });
        }
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 300, 170, { align: 'right', width: 245 });

        doc.y = currentY + 30; // Reset Y to start content
    }

    private static drawFooter(doc: PDFKit.PDFDocument, doctorName: string, crm?: string) {
        const bottom = doc.page.height - 120;

        // Signature Line
        doc.moveTo(172, bottom).lineTo(422, bottom).lineWidth(0.5).strokeColor('#94a3b8').stroke();

        doc.fillColor('#1e293b').font(FONT_BOLD).fontSize(10).text(`Dr(a). ${doctorName}`, 50, bottom + 10, { align: 'center' });
        doc.fillColor('#64748b').font(FONT_REGULAR).fontSize(9).text(crm ? `CRM: ${crm}` : 'CRM não informado', { align: 'center' });

        // Date and Info
        doc.fontSize(8).fillColor('#94a3b8').text('Documento eletrônico gerado pelo SDMED System • Validação via QR Code ou Assinatura Digital', 50, doc.page.height - 40, { align: 'center' });
    }

    static async generatePrescription(data: PrescriptionData): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new (require('pdfkit'))({ size: 'A4', margin: 50 });
                const chunks: Buffer[] = [];
                doc.on('data', (chunk: Buffer) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                this.drawHeader(doc, 'RECEITUÁRIO MÉDICO', data.doctorName, data.crm);

                // Patient Area
                doc.fontSize(13).fillColor('#1e293b').font(FONT_REGULAR).text('PACIENTE:', { continued: true });
                doc.fontSize(13).font(FONT_BOLD).text(` ${data.patientName}`);
                doc.moveDown(2);

                // Content Area - Medications
                doc.font(FONT_BOLD).fontSize(12).text('USO EXTERNO/INTERNO:', { underline: true });
                doc.moveDown(1);
                doc.font(FONT_REGULAR).fontSize(12).fillColor('#334155').text(data.medications, {
                    align: 'justify',
                    lineGap: 6
                });

                if (data.instructions) {
                    doc.moveDown(2);
                    doc.font(FONT_BOLD).fontSize(12).text('ORIENTAÇÕES:', { underline: true });
                    doc.moveDown(0.5);
                    doc.font(FONT_REGULAR).fontSize(11).text(data.instructions, { align: 'justify' });
                }

                this.drawFooter(doc, data.doctorName, data.crm);
                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    static async generateCertificate(data: CertificateData): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new (require('pdfkit'))({ size: 'A4', margin: 50 });
                const chunks: Buffer[] = [];
                doc.on('data', (chunk: Buffer) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                this.drawHeader(doc, 'ATESTADO MÉDICO', data.doctorName, data.crm);

                doc.font(FONT_REGULAR).fontSize(12).fillColor('#334155');
                const text = `Atesto para os devidos fins que o(a) Sr(a). ${data.patientName} foi atendido(a) sob meus cuidados profissionais no dia ${data.date}.`;
                doc.text(text, { align: 'justify', lineGap: 8 });

                doc.moveDown(1);
                const duration = data.days > 0
                    ? `O(A) mesmo(a) necessita de ${data.days} dia(s) de afastamento de suas atividades por razões médicas.`
                    : `O(A) mesmo(a) compareceu à consulta e encontra-se apto(a) a retornar às suas atividades.`;
                doc.text(duration, { align: 'justify', lineGap: 8 });

                if (data.cid) {
                    doc.moveDown(1);
                    doc.font(FONT_BOLD).text(`CID: `, { continued: true }).font(FONT_REGULAR).text(data.cid);
                }

                if (data.observation) {
                    doc.moveDown(1.5);
                    doc.font(FONT_BOLD).text('Observações:');
                    doc.font(FONT_REGULAR).fontSize(11).text(data.observation, { align: 'justify' });
                }

                this.drawFooter(doc, data.doctorName, data.crm);
                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    static async generateReport(data: ReportData): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new (require('pdfkit'))({ size: 'A4', margin: 50 });
                const chunks: Buffer[] = [];
                doc.on('data', (chunk: Buffer) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                this.drawHeader(doc, 'LAUDO MÉDICO', data.doctorName, data.crm);

                doc.fontSize(12).font(FONT_BOLD).text('PACIENTE: ', { continued: true })
                    .font(FONT_REGULAR).text(data.patientName);
                doc.moveDown(1.5);

                doc.font(FONT_BOLD).text('RELATÓRIO CLÍNICO:');
                doc.moveDown(0.5);
                doc.font(FONT_REGULAR).fontSize(11).fillColor('#334155').text(data.content, { align: 'justify', lineGap: 5 });

                this.drawFooter(doc, data.doctorName, data.crm);
                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    static async generateExamRequest(data: ExamRequestData): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new (require('pdfkit'))({ size: 'A4', margin: 50 });
                const chunks: Buffer[] = [];
                doc.on('data', (chunk: Buffer) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                this.drawHeader(doc, 'SOLICITAÇÃO DE EXAMES', data.doctorName, data.crm);

                doc.fontSize(12).font(FONT_BOLD).text('PACIENTE: ', { continued: true })
                    .font(FONT_REGULAR).text(data.patientName);
                doc.moveDown(1.5);

                doc.font(FONT_BOLD).text('EXAMES SOLICITADOS:');
                doc.moveDown(0.5);
                doc.font(FONT_REGULAR).fontSize(11).fillColor('#334155').text(data.examList, { align: 'justify', lineGap: 5 });

                if (data.justification) {
                    doc.moveDown(1.5);
                    doc.font(FONT_BOLD).fontSize(11).text('JUSTIFICATIVA CLÍNICA:');
                    doc.font(FONT_REGULAR).text(data.justification, { align: 'justify' });
                }

                this.drawFooter(doc, data.doctorName, data.crm);
                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    static async generateReferral(data: ReferralData): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new (require('pdfkit'))({ size: 'A4', margin: 50 });
                const chunks: Buffer[] = [];
                doc.on('data', (chunk: Buffer) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                this.drawHeader(doc, 'GUIA DE ENCAMINHAMENTO', data.doctorName, data.crm);

                doc.fontSize(12).font(FONT_BOLD).text('PACIENTE: ', { continued: true })
                    .font(FONT_REGULAR).text(data.patientName);
                doc.moveDown(1);

                doc.font(FONT_BOLD).text('PARA: ', { continued: true })
                    .font(FONT_REGULAR).text(data.specialty);
                doc.moveDown(1.5);

                doc.font(FONT_BOLD).text('MOTIVO / SUSPEITA CLÍNICA:');
                doc.font(FONT_REGULAR).fontSize(11).text(data.reason, { align: 'justify', lineGap: 4 });

                if (data.clinicalSummary) {
                    doc.moveDown(1);
                    doc.font(FONT_BOLD).text('RESUMO CLÍNICO:');
                    doc.font(FONT_REGULAR).fontSize(11).text(data.clinicalSummary, { align: 'justify' });
                }

                if (data.observation) {
                    doc.moveDown(1);
                    doc.font(FONT_BOLD).text('OBSERVAÇÕES:');
                    doc.font(FONT_REGULAR).fontSize(11).text(data.observation, { align: 'justify' });
                }

                this.drawFooter(doc, data.doctorName, data.crm);
                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }
}
