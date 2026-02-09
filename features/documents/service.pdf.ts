import PDFDocument from 'pdfkit';

interface PrescriptionData {
    patientName: string;
    doctorName: string;
    medications: string; // Rich text or simple text
    instructions: string;
    date: string;
}

export class PdfService {
    static async generatePrescription(data: PrescriptionData): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(20).text('SDMED - Receita Médica', { align: 'center' });
            doc.moveDown();

            // Doctor Info
            doc.fontSize(12).text(`Dr(a). ${data.doctorName}`, { align: 'right' });
            doc.text(`Data: ${new Date(data.date).toLocaleDateString('pt-BR')}`, { align: 'right' });
            doc.moveDown();

            // Patient Info
            doc.fontSize(14).text(`Paciente: ${data.patientName}`, { align: 'left' });
            doc.moveDown();

            // Divider
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
            doc.moveDown();

            // Body (Medications)
            doc.fontSize(12).text('Uso:', { underline: true });
            doc.moveDown(0.5);
            doc.text(data.medications, {
                align: 'justify',
                lineGap: 5
            });

            doc.moveDown();

            if (data.instructions) {
                doc.fontSize(12).text('Instruções:', { underline: true });
                doc.moveDown(0.5);
                doc.text(data.instructions);
            }

            // Footer
            const bottom = doc.page.height - 100;
            doc.fontSize(10).text('Assinatura Eletrônica', 50, bottom, { align: 'center', width: 500 });
            doc.text('Documento gerado pelo sistema SDMED', { align: 'center', width: 500 });

            doc.end();
        });
    }

    static async generateCertificate(data: { patientName: string; doctorName: string; date: string; days?: number; cid?: string; observation?: string }): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks: Buffer[] = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            doc.fontSize(24).text('ATESTADO MÉDICO', { align: 'center' });
            doc.moveDown(2);

            doc.fontSize(12).text(`Atesto para os devidos fins que o(a) Sr(a). ${data.patientName}`, { align: 'justify' });
            doc.moveDown(0.5);

            let text = `foi atendido(a) nesta data.`;
            if (data.days) {
                text += ` Necessita de ${data.days} (${data.days === 1 ? 'um dia' : 'dias'}) de afastamento de suas atividades laborais/escolares.`;
            }
            doc.text(text, { align: 'justify' });

            if (data.cid) {
                doc.moveDown();
                doc.text(`CID: ${data.cid}`);
            }

            if (data.observation) {
                doc.moveDown();
                doc.text(`Observações: ${data.observation}`);
            }

            doc.moveDown(4);
            doc.text(new Date(data.date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' }), { align: 'right' });

            const bottom = doc.page.height - 100;
            doc.fontSize(10).text(`Dr(a). ${data.doctorName}`, 50, bottom, { align: 'center', width: 500 });
            doc.text('Assinatura Eletrônica', { align: 'center', width: 500 });

            doc.end();
        });
    }

    static async generateReport(data: { patientName: string; doctorName: string; date: string; content: string }): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks: Buffer[] = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            doc.fontSize(20).text('LAUDO MÉDICO', { align: 'center' });
            doc.moveDown(2);

            doc.fontSize(12).text(`Paciente: ${data.patientName}`);
            doc.text(`Data: ${new Date(data.date).toLocaleDateString('pt-BR')}`);
            doc.moveDown(2);

            doc.text(data.content, { align: 'justify', lineGap: 5 });

            const bottom = doc.page.height - 100;
            doc.fontSize(10).text(`Dr(a). ${data.doctorName}`, 50, bottom, { align: 'center', width: 500 });
            doc.end();
        });
    }
}
