import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

// Fix Next.js compilation issues with pdfkit (it often resolves to an object with a .default property)
const PDFDocConstructor = typeof PDFDocument === 'function' ? PDFDocument : (PDFDocument as any).default || PDFDocument;

// Standard fonts for PDFKit can have issues in Next.js environment (AFM files missing)
// We use bundled TTF fonts to ensure stability across all environments.
// Reading them via fs.readFileSync explicitly forces the Next.js/Vercel static analyzer to include them.
const fontRegularPath = path.resolve(process.cwd(), 'features', 'documents', 'fonts', 'Regular.ttf');
const fontBoldPath = path.resolve(process.cwd(), 'features', 'documents', 'fonts', 'Bold.ttf');

const FONT_REGULAR = fs.readFileSync(fontRegularPath);
const FONT_BOLD = fs.readFileSync(fontBoldPath);

export interface BaseDocumentData {
    patientName: string;
    doctorName: string;
    crm?: string;
    date: string;
    clinic?: {
        name?: string;
        logoUrl?: string;
        phone?: string;
        website?: string;
        address?: string;
    };
}

export interface PrescriptionData extends BaseDocumentData {
    medications: string;
    instructions: string;
}

export interface CertificateData extends BaseDocumentData {
    days: number;
    cid?: string;
    observation?: string;
}

export interface ReportData extends BaseDocumentData {
    content: string;
}

export interface ExamRequestData extends BaseDocumentData {
    examList: string;
    justification?: string;
}

export interface ReferralData extends BaseDocumentData {
    specialty: string;
    reason: string;
    clinicalSummary?: string;
    observation?: string;
}

export class PdfService {
    private static async drawHeader(doc: PDFKit.PDFDocument, title: string, data: BaseDocumentData) {
        let currentX = 50;

        // Logo
        if (data.clinic?.logoUrl) {
            try {
                const response = await fetch(data.clinic.logoUrl);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    const logoBuffer = Buffer.from(arrayBuffer);
                    doc.image(logoBuffer, 50, 40, { fit: [50, 50], valign: 'center' });
                    currentX = 110;
                }
            } catch (err) {
                console.error('Failed to load clinic logo for PDF:', err);
            }
        }

        // Clinic Name
        const clinicName = data.clinic?.name || 'SDMED SYS';
        doc.fillColor('#0f172a').font(FONT_BOLD).fontSize(16).text(clinicName, currentX, 45);

        // Contact Info under Clinic Name
        doc.fillColor('#64748b').font(FONT_REGULAR).fontSize(8);
        let contactText = '';
        if (data.clinic?.phone) contactText += `Tel: ${data.clinic.phone}  `;
        if (data.clinic?.website) contactText += `|  ${data.clinic.website}`;

        if (contactText) {
            doc.text(contactText, currentX, 65);
        } else {
            doc.text('SISTEMA DE GESTÃO MÉDICA INTELIGENTE', currentX, 65);
        }

        // Header Decoration
        doc.moveTo(50, 95).lineTo(545, 95).lineWidth(1).strokeColor('#e2e8f0').stroke();

        // Document Title
        doc.fillColor('#1e293b').font(FONT_BOLD).fontSize(16).text(title, 50, 115, { align: 'center' });
        doc.moveDown(1.5);

        // Header Metadata (Doctor Info)
        const currentY = doc.y;
        doc.fillColor('#475569').font(FONT_REGULAR).fontSize(10);
        doc.text(`Profissional: ${data.doctorName}`, 300, 150, { align: 'right', width: 245 });
        if (data.crm) {
            doc.text(`CRM: ${data.crm}`, 300, 165, { align: 'right', width: 245 });
        }
        doc.text(`Data: ${data.date}`, 300, 180, { align: 'right', width: 245 });

        doc.y = currentY + 40; // Reset Y to start content
    }

    private static drawFooter(doc: PDFKit.PDFDocument, data: BaseDocumentData) {
        const bottom = doc.page.height - 120;

        // Signature Line
        doc.moveTo(172, bottom).lineTo(422, bottom).lineWidth(0.5).strokeColor('#94a3b8').stroke();

        doc.fillColor('#1e293b').font(FONT_BOLD).fontSize(10).text(`Dr(a). ${data.doctorName}`, 50, bottom + 10, { align: 'center' });
        doc.fillColor('#64748b').font(FONT_REGULAR).fontSize(9).text(data.crm ? `CRM: ${data.crm}` : 'CRM não informado', { align: 'center' });

        // Address at the very bottom
        if (data.clinic?.address) {
            doc.fontSize(8).fillColor('#94a3b8').text(data.clinic.address, 50, doc.page.height - 55, { align: 'center' });
        }

        // Date and Info
        doc.fontSize(8).fillColor('#94a3b8').text('Documento eletrônico gerado pelo SDMED System • Validação via QR Code ou Assinatura Digital', 50, doc.page.height - 40, { align: 'center' });
    }

    static async generatePrescription(data: PrescriptionData): Promise<Buffer> {
        return new Promise(async (resolve, reject) => {
            try {
                const doc = new PDFDocConstructor({ size: 'A4', margin: 50, font: FONT_REGULAR });
                const chunks: Buffer[] = [];
                doc.on('data', (chunk: Buffer) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                await this.drawHeader(doc, 'RECEITUÁRIO MÉDICO', data);

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

                this.drawFooter(doc, data);
                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    static async generateCertificate(data: CertificateData): Promise<Buffer> {
        return new Promise(async (resolve, reject) => {
            try {
                const doc = new PDFDocConstructor({ size: 'A4', margin: 50, font: FONT_REGULAR });
                const chunks: Buffer[] = [];
                doc.on('data', (chunk: Buffer) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                await this.drawHeader(doc, 'ATESTADO MÉDICO', data);

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

                this.drawFooter(doc, data);
                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    static async generateReport(data: ReportData): Promise<Buffer> {
        return new Promise(async (resolve, reject) => {
            try {
                const doc = new PDFDocConstructor({ size: 'A4', margin: 50, font: FONT_REGULAR });
                const chunks: Buffer[] = [];
                doc.on('data', (chunk: Buffer) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                await this.drawHeader(doc, 'LAUDO MÉDICO', data);

                doc.fontSize(12).font(FONT_BOLD).text('PACIENTE: ', { continued: true })
                    .font(FONT_REGULAR).text(data.patientName);
                doc.moveDown(1.5);

                doc.font(FONT_BOLD).text('RELATÓRIO CLÍNICO:');
                doc.moveDown(0.5);
                doc.font(FONT_REGULAR).fontSize(11).fillColor('#334155').text(data.content, { align: 'justify', lineGap: 5 });

                this.drawFooter(doc, data);
                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    static async generateExamRequest(data: ExamRequestData): Promise<Buffer> {
        return new Promise(async (resolve, reject) => {
            try {
                const doc = new PDFDocConstructor({ size: 'A4', margin: 50, font: FONT_REGULAR });
                const chunks: Buffer[] = [];
                doc.on('data', (chunk: Buffer) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                await this.drawHeader(doc, 'SOLICITAÇÃO DE EXAMES', data);

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

                this.drawFooter(doc, data);
                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    static async generateReferral(data: ReferralData): Promise<Buffer> {
        return new Promise(async (resolve, reject) => {
            try {
                const doc = new PDFDocConstructor({ size: 'A4', margin: 50, font: FONT_REGULAR });
                const chunks: Buffer[] = [];
                doc.on('data', (chunk: Buffer) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                await this.drawHeader(doc, 'GUIA DE ENCAMINHAMENTO', data);

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

                this.drawFooter(doc, data);
                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }
}
