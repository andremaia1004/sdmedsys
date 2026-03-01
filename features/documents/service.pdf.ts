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
    // Design System Tokens
    private static readonly colors = {
        primary: '#002D5E', // Deep Blue
        accent: '#D32F2F',  // Deep Red
        textMain: '#1E293B',// Dark Slate
        textMuted: '#64748B',// Gray Slate
        border: '#E2E8F0',  // Subtle Border
    };

    private static async drawHeader(doc: PDFKit.PDFDocument, title: string, data: BaseDocumentData) {
        // Accent Bar at the top edge
        doc.rect(0, 0, doc.page.width, 8).fill(this.colors.accent);

        let currentX = 50;
        const topY = 45;

        // Logo
        if (data.clinic?.logoUrl) {
            try {
                const response = await fetch(data.clinic.logoUrl);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    const logoBuffer = Buffer.from(arrayBuffer);
                    // Fit logo elegantly
                    doc.image(logoBuffer, 50, topY - 5, { fit: [60, 60], valign: 'center' });
                    currentX = 125;
                }
            } catch (err) {
                console.error('Failed to load clinic logo for PDF:', err);
            }
        }

        // Clinic Name
        const clinicName = data.clinic?.name || 'SDMED SYS';
        doc.fillColor(this.colors.primary).font(FONT_BOLD).fontSize(16).text(clinicName, currentX, topY);

        // Contact Info under Clinic Name
        doc.fillColor(this.colors.textMuted).font(FONT_REGULAR).fontSize(9);
        let contactText = '';
        if (data.clinic?.phone) contactText += `Tel: ${data.clinic.phone}  `;
        if (data.clinic?.website) contactText += `|  ${data.clinic.website}`;

        if (contactText) {
            doc.text(contactText, currentX, topY + 22);
        } else {
            doc.text('SISTEMA DE GESTÃO MÉDICA INTELIGENTE', currentX, topY + 22);
        }

        // Address (if available) underneath
        if (data.clinic?.address) {
            doc.text(data.clinic.address, currentX, topY + 36);
        }

        // Header Decoration Line
        const lineY = topY + 65;
        doc.moveTo(50, lineY).lineTo(doc.page.width - 50, lineY).lineWidth(1).strokeColor(this.colors.border).stroke();

        // Document Title
        doc.fillColor(this.colors.primary).font(FONT_BOLD).fontSize(18).text(title, 50, lineY + 25, { align: 'center', characterSpacing: 2 });
        doc.moveDown(1.5);

        // Header Metadata (Doctor Info)
        const metadataY = doc.y;
        doc.fillColor(this.colors.textMuted).font(FONT_REGULAR).fontSize(10);

        doc.text(`Profissional: ${data.doctorName}`, 300, metadataY, { align: 'right', width: 245 });
        if (data.crm) {
            doc.text(`CRM: ${data.crm}`, 300, metadataY + 15, { align: 'right', width: 245 });
        }
        doc.text(`Data: ${data.date}`, 300, metadataY + 30, { align: 'right', width: 245 });

        // Extra white space before content
        doc.y = Math.max(metadataY + 65, lineY + 100);
    }

    private static drawFooter(doc: PDFKit.PDFDocument, data: BaseDocumentData) {
        const bottom = doc.page.height - 110;

        // Signature Line
        doc.moveTo(172, bottom).lineTo(422, bottom).lineWidth(0.5).strokeColor(this.colors.textMain).stroke();

        doc.fillColor(this.colors.primary).font(FONT_BOLD).fontSize(11).text(`Dr(a). ${data.doctorName}`, 50, bottom + 12, { align: 'center' });
        doc.fillColor(this.colors.textMuted).font(FONT_REGULAR).fontSize(9).text(data.crm ? `CRM: ${data.crm}` : 'CRM não informado', { align: 'center' });

        // Date and Info
        doc.fontSize(8).fillColor(this.colors.textMuted).text('Documento eletrônico gerado pelo SDMED System • Validação via QR Code ou Assinatura Digital', 50, doc.page.height - 40, { align: 'center' });

        // Primary color subtle bottom border
        doc.rect(0, doc.page.height - 4, doc.page.width, 4).fill(this.colors.primary);
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
                doc.fontSize(12).fillColor(this.colors.primary).font(FONT_BOLD).text('PACIENTE: ', { continued: true })
                    .fillColor(this.colors.textMain).font(FONT_REGULAR).text(data.patientName);
                doc.moveDown(2.5);

                // Content Area - Medications
                doc.fillColor(this.colors.primary).font(FONT_BOLD).fontSize(11).text('USO EXTERNO/INTERNO:', { characterSpacing: 1 });
                doc.moveDown(0.8);
                doc.font(FONT_REGULAR).fontSize(11).fillColor(this.colors.textMain).text(data.medications, {
                    align: 'justify',
                    lineGap: 8
                });

                if (data.instructions) {
                    doc.moveDown(2.5);
                    doc.fillColor(this.colors.primary).font(FONT_BOLD).fontSize(11).text('ORIENTAÇÕES:', { characterSpacing: 1 });
                    doc.moveDown(0.8);
                    doc.font(FONT_REGULAR).fontSize(11).fillColor(this.colors.textMain).text(data.instructions, { align: 'justify', lineGap: 6 });
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

                doc.font(FONT_REGULAR).fontSize(12).fillColor(this.colors.textMain);
                const text = `Atesto para os devidos fins que o(a) Sr(a). ${data.patientName} foi atendido(a) sob meus cuidados profissionais no dia ${data.date}.`;
                doc.text(text, { align: 'justify', lineGap: 10 });

                doc.moveDown(1.5);
                const duration = data.days > 0
                    ? `O(A) mesmo(a) necessita de ${data.days} dia(s) de afastamento de suas atividades por razões médicas.`
                    : `O(A) mesmo(a) compareceu à consulta e encontra-se apto(a) a retornar às suas atividades.`;
                doc.text(duration, { align: 'justify', lineGap: 10 });

                if (data.cid) {
                    doc.moveDown(2);
                    doc.fillColor(this.colors.primary).font(FONT_BOLD).text(`CID: `, { continued: true })
                        .fillColor(this.colors.textMain).font(FONT_REGULAR).text(data.cid);
                }

                if (data.observation) {
                    doc.moveDown(2);
                    doc.fillColor(this.colors.primary).font(FONT_BOLD).text('OBSERVAÇÕES:', { characterSpacing: 1 });
                    doc.moveDown(0.8);
                    doc.fillColor(this.colors.textMuted).font(FONT_REGULAR).fontSize(11).text(data.observation, { align: 'justify', lineGap: 6 });
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

                doc.fontSize(12).fillColor(this.colors.primary).font(FONT_BOLD).text('PACIENTE: ', { continued: true })
                    .fillColor(this.colors.textMain).font(FONT_REGULAR).text(data.patientName);
                doc.moveDown(2.5);

                doc.fillColor(this.colors.primary).font(FONT_BOLD).fontSize(11).text('RELATÓRIO CLÍNICO:', { characterSpacing: 1 });
                doc.moveDown(0.8);
                doc.fillColor(this.colors.textMain).font(FONT_REGULAR).fontSize(11).text(data.content, { align: 'justify', lineGap: 8 });

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

                doc.fontSize(12).fillColor(this.colors.primary).font(FONT_BOLD).text('PACIENTE: ', { continued: true })
                    .fillColor(this.colors.textMain).font(FONT_REGULAR).text(data.patientName);
                doc.moveDown(2.5);

                doc.fillColor(this.colors.primary).font(FONT_BOLD).fontSize(11).text('EXAMES SOLICITADOS:', { characterSpacing: 1 });
                doc.moveDown(0.8);
                doc.fillColor(this.colors.textMain).font(FONT_REGULAR).fontSize(11).text(data.examList, { align: 'justify', lineGap: 8 });

                if (data.justification) {
                    doc.moveDown(2);
                    doc.fillColor(this.colors.primary).font(FONT_BOLD).fontSize(11).text('JUSTIFICATIVA CLÍNICA:', { characterSpacing: 1 });
                    doc.moveDown(0.8);
                    doc.fillColor(this.colors.textMuted).font(FONT_REGULAR).text(data.justification, { align: 'justify', lineGap: 6 });
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

                doc.fontSize(12).fillColor(this.colors.primary).font(FONT_BOLD).text('PACIENTE: ', { continued: true })
                    .fillColor(this.colors.textMain).font(FONT_REGULAR).text(data.patientName);
                doc.moveDown(1.5);

                doc.fillColor(this.colors.primary).font(FONT_BOLD).text('PARA: ', { continued: true })
                    .fillColor(this.colors.textMain).font(FONT_REGULAR).text(data.specialty);
                doc.moveDown(2.5);

                doc.fillColor(this.colors.primary).font(FONT_BOLD).fontSize(11).text('MOTIVO / SUSPEITA CLÍNICA:', { characterSpacing: 1 });
                doc.moveDown(0.8);
                doc.fillColor(this.colors.textMain).font(FONT_REGULAR).fontSize(11).text(data.reason, { align: 'justify', lineGap: 6 });

                if (data.clinicalSummary) {
                    doc.moveDown(2);
                    doc.fillColor(this.colors.primary).font(FONT_BOLD).text('RESUMO CLÍNICO:', { characterSpacing: 1 });
                    doc.moveDown(0.8);
                    doc.fillColor(this.colors.textMain).font(FONT_REGULAR).fontSize(11).text(data.clinicalSummary, { align: 'justify', lineGap: 6 });
                }

                if (data.observation) {
                    doc.moveDown(2);
                    doc.fillColor(this.colors.primary).font(FONT_BOLD).text('OBSERVAÇÕES:', { characterSpacing: 1 });
                    doc.moveDown(0.8);
                    doc.fillColor(this.colors.textMuted).font(FONT_REGULAR).fontSize(11).text(data.observation, { align: 'justify', lineGap: 6 });
                }

                this.drawFooter(doc, data);
                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }
}
