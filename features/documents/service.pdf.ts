import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

// Fix Next.js compilation issues with pdfkit (it often resolves to an object with a .default property)
const PDFDocConstructor = typeof PDFDocument === 'function' ? PDFDocument : (PDFDocument as any).default || PDFDocument;

// Standard fonts
const fontRegularPath = path.resolve(process.cwd(), 'features', 'documents', 'fonts', 'Regular.ttf');
const fontBoldPath = path.resolve(process.cwd(), 'features', 'documents', 'fonts', 'Bold.ttf');
const FONT_REGULAR = fs.readFileSync(fontRegularPath);
const FONT_BOLD = fs.readFileSync(fontBoldPath);

// Clinic Logo
const defaultLogoPath = path.resolve(process.cwd(), 'logo-clinica', 'logo-clinica.png');
let DEFAULT_LOGO: Buffer | null = null;
try {
    DEFAULT_LOGO = fs.readFileSync(defaultLogoPath);
} catch (e) {
    console.warn('Default clinic logo not found at /logo-clinica/logo-clinica.png');
}

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
    // Design System Tokens (From Inspiration + Clinic Colors)
    private static readonly colors = {
        primary: '#002D5E',    // Deep Blue
        accent: '#D32F2F',     // Deep Red
        textMain: '#1E293B',   // Dark Slate
        textMuted: '#64748B',  // Gray Slate
        bgLight: '#F1F5F9',    // Very light grayish blue (for patient box)
        border: '#E2E8F0',     // Subtle Border
        watermark: '#E2E8F0',  // Light tint for watermark/Rx
    };

    private static drawGeometricHeader(doc: PDFKit.PDFDocument) {
        const width = doc.page.width;

        // Deep Blue shape (Top Left)
        doc.polygon(
            [0, 0],
            [width * 0.45, 0],
            [width * 0.35, 60],
            [0, 60]
        ).fill(this.colors.primary);

        // Deep Red Accent Stripe line (Parallel to slant)
        doc.polygon(
            [width * 0.465, 0],
            [width * 0.48, 0],
            [width * 0.38, 60],
            [width * 0.365, 60]
        ).fill(this.colors.accent);
    }

    private static drawGeometricFooter(doc: PDFKit.PDFDocument) {
        const width = doc.page.width;
        const height = doc.page.height;

        // Deep Blue shape (Bottom Right)
        doc.polygon(
            [width * 0.55, height],
            [width, height],
            [width, height - 60],
            [width * 0.65, height - 60]
        ).fill(this.colors.primary);

        // Deep Red Accent Stripe line (Parallel to slant)
        doc.polygon(
            [width * 0.52, height],
            [width * 0.535, height],
            [width * 0.635, height - 60],
            [width * 0.62, height - 60]
        ).fill(this.colors.accent);
    }

    private static drawDotsDecoration(doc: PDFKit.PDFDocument, startX: number, startY: number, rows: number, cols: number) {
        const dotSpacing = 8;
        const radius = 1;
        doc.fillColor(this.colors.watermark);
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                doc.circle(startX + (c * dotSpacing), startY + (r * dotSpacing), radius).fill();
            }
        }
    }

    private static drawPatientInfoBox(doc: PDFKit.PDFDocument, data: BaseDocumentData, startY: number): number {
        const boxHeight = 65;
        const margin = 50;
        const contentWidth = doc.page.width - (margin * 2);

        // Background Box
        doc.roundedRect(margin, startY, contentWidth, boxHeight, 8).fill(this.colors.bgLight);

        const textY = startY + 12;
        doc.fillColor(this.colors.textMuted).fontSize(9).font(FONT_REGULAR);

        // Left Column: Patient Name & Address (Mocked if missing in base, but let's use what we have)
        doc.text('Paciente:', margin + 15, textY);
        doc.fillColor(this.colors.textMain).text(data.patientName, margin + 55, textY);

        doc.fillColor(this.colors.textMuted).text('Detalhes:', margin + 15, textY + 20);
        doc.fillColor(this.colors.textMain).text('Conforme cadastro clínico', margin + 55, textY + 20); // Placeholder unless we add address

        // Right Column: Date
        doc.fillColor(this.colors.textMuted).text('Data:', margin + contentWidth - 140, textY);
        doc.fillColor(this.colors.textMain).text(data.date, margin + contentWidth - 110, textY);

        // Draw thin lines to mimic form fields
        doc.moveTo(margin + 55, textY + 11).lineTo(margin + contentWidth - 160, textY + 11).lineWidth(0.5).strokeColor(this.colors.border).stroke();
        doc.moveTo(margin + 55, textY + 31).lineTo(margin + contentWidth - 160, textY + 31).lineWidth(0.5).strokeColor(this.colors.border).stroke();
        doc.moveTo(margin + contentWidth - 110, textY + 11).lineTo(margin + contentWidth - 15, textY + 11).lineWidth(0.5).strokeColor(this.colors.border).stroke();

        return startY + boxHeight + 25; // Return next Y position
    }

    private static async drawHeader(doc: PDFKit.PDFDocument, title: string, data: BaseDocumentData) {
        this.drawGeometricHeader(doc);

        const width = doc.page.width;
        let rightEdgeX = width - 50;

        // Draw Right-Aligned Logo
        let localLogo = DEFAULT_LOGO;
        if (!localLogo) {
            try {
                const logoPath = path.resolve(process.cwd(), 'logo-clinica', 'logo-clinica.png');
                if (fs.existsSync(logoPath)) {
                    localLogo = fs.readFileSync(logoPath);
                    DEFAULT_LOGO = localLogo; // cache for next time
                }
            } catch (e) { }
        }

        if (localLogo) {
            doc.image(localLogo, rightEdgeX - 140, 15, { fit: [140, 55], align: 'right' });
        } else if (data.clinic?.logoUrl) {
            try {
                const response = await fetch(data.clinic.logoUrl);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    const logoBuffer = Buffer.from(arrayBuffer);
                    doc.image(logoBuffer, rightEdgeX - 140, 15, { fit: [140, 55], align: 'right' });
                }
            } catch (err) { }
        } else {
            const clinicName = data.clinic?.name || 'SDMED SYS';
            doc.fillColor(this.colors.primary).font(FONT_BOLD).fontSize(16).text(clinicName, rightEdgeX - 150, 25, { width: 150, align: 'right' });
        }

        // Contact Info Bar below geometric shape
        const contactY = 75;
        let contactText = '';
        if (data.clinic?.address) contactText += `${data.clinic.address}   `;
        if (data.clinic?.phone) contactText += `Cel/Whatsapp: ${data.clinic.phone}   `;
        if (data.clinic?.website) contactText += `|   ${data.clinic.website}`;

        if (!contactText) contactText = 'Avenida Principal 123, Sala 404 - Centro | Tel: (00) 0000-0000 | clinicamedica.com';

        doc.moveTo(50, contactY - 5).lineTo(width - 50, contactY - 5).lineWidth(0.5).strokeColor(this.colors.border).stroke();
        doc.fillColor(this.colors.textMuted).font(FONT_REGULAR).fontSize(8)
            .text(contactText, 50, contactY, { align: 'center', width: width - 100 });
        doc.moveTo(50, contactY + 15).lineTo(width - 50, contactY + 15).lineWidth(0.5).strokeColor(this.colors.border).stroke();

        // Doctor Header Info (Left Aligned instead of right to match reference)
        const doctorY = 110;
        doc.fillColor(this.colors.primary).font(FONT_BOLD).fontSize(18).text(`Dr(a). ${data.doctorName}`, 50, doctorY);
        doc.fillColor(this.colors.textMuted).font(FONT_REGULAR).fontSize(10)
            .text(`Médico(a) Especialista${data.crm ? '  •  CRM ' + data.crm : ''}`, 50, doctorY + 22);

        // Document Title Box (Right Aligned or Center)
        doc.roundedRect(width - 200, doctorY + 2, 150, 25, 4).fill(this.colors.bgLight);
        doc.fillColor(this.colors.primary).font(FONT_BOLD).fontSize(12).text(title, width - 200, doctorY + 8, { width: 150, align: 'center' });

        // Patient Box setup
        const nextY = this.drawPatientInfoBox(doc, data, doctorY + 55);
        doc.y = nextY;

        // Add Watermark Dots
        this.drawDotsDecoration(doc, 40, nextY + 30, 8, 4);
        this.drawDotsDecoration(doc, width - 70, nextY + 30, 8, 4);

        // RESET X COORDINATE FOR BODY CONTENT
        // (Prevents text from wrapping on the right side)
        doc.x = 50;
    }

    private static drawFooter(doc: PDFKit.PDFDocument, data: BaseDocumentData) {
        this.drawGeometricFooter(doc);
        const height = doc.page.height;

        // Signature Line
        doc.moveTo(200, height - 120).lineTo(400, height - 120).lineWidth(1).strokeColor(this.colors.textMain).stroke();
        doc.fillColor(this.colors.primary).font(FONT_BOLD).fontSize(11).text(`Dr(a). ${data.doctorName}`, 150, height - 110, { width: 300, align: 'center' });

        // Footer Contact
        doc.fillColor(this.colors.textMuted).font(FONT_REGULAR).fontSize(9);
        doc.text(data.clinic?.phone ? `Tel: ${data.clinic.phone}` : '', 50, height - 55);
        doc.text(data.clinic?.address || 'Documento Eletrônico • SDMED System', 50, height - 43);
    }

    static async generatePrescription(data: PrescriptionData): Promise<Buffer> {
        return new Promise(async (resolve, reject) => {
            try {
                const doc = new PDFDocConstructor({ size: 'A4', margin: 50, font: FONT_REGULAR });
                const chunks: Buffer[] = [];
                doc.on('data', (chunk: Buffer) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                await this.drawHeader(doc, 'RECEITA', data);

                // Add Rx Logo for prescription
                doc.fillColor(this.colors.primary).font(FONT_BOLD).fontSize(36).text('Rx', 50, doc.y);
                doc.y += 20;

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

                await this.drawHeader(doc, 'ATESTADO', data);

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

                await this.drawHeader(doc, 'LAUDO', data);

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
