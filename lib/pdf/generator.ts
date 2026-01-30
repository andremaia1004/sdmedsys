import PDFDocument from 'pdfkit';

export interface DocumentHeader {
    clinicName: string;
    clinicAddress?: string;
    clinicPhone?: string;
}

export interface PatientInfo {
    name: string;
    document?: string;
    birthDate?: string;
}

export interface DoctorInfo {
    name: string;
    crm?: string;
}

export function createBasePDF(header: DocumentHeader) {
    const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true
    });

    // Header
    doc.fontSize(16).text(header.clinicName, { align: 'center' });
    if (header.clinicAddress) {
        doc.fontSize(9).text(header.clinicAddress, { align: 'center' });
    }
    if (header.clinicPhone) {
        doc.fontSize(9).text(`Tel: ${header.clinicPhone}`, { align: 'center' });
    }

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
    doc.moveDown(2);

    return doc;
}

export function addFooter(doc: PDFKit.PDFDocument, doctor: DoctorInfo) {
    const bottom = doc.page.height - 100;

    doc.moveTo(150, bottom).lineTo(445, bottom).stroke('#000000');
    doc.moveDown(0.5);
    doc.fontSize(10).text(doctor.name, 50, bottom + 10, { align: 'center' });
    if (doctor.crm) {
        doc.fontSize(9).text(`CRM: ${doctor.crm}`, { align: 'center' });
    } else {
        doc.fontSize(9).text(`CRM não informado`, { align: 'center' });
    }
}
