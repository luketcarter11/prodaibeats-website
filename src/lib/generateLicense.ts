import PDFDocument from 'pdfkit'

interface LicenseData {
  trackId: string
  customerEmail: string
  purchaseDate: string
}

export async function generateLicense(data: LicenseData): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument()
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))

    // Add content to the PDF
    doc.fontSize(25).text('ProdAI Beats License', { align: 'center' })
    doc.moveDown()
    doc.fontSize(12).text(`License Date: ${new Date(data.purchaseDate).toLocaleDateString()}`)
    doc.text(`Licensee: ${data.customerEmail}`)
    doc.text(`Track ID: ${data.trackId}`)
    doc.moveDown()
    doc.text('License Terms:')
    doc.moveDown()
    doc.text('1. This license grants the licensee the right to use the track for commercial purposes.')
    doc.text('2. The licensee may use the track in unlimited projects.')
    doc.text('3. The licensee may not resell or redistribute the track.')
    doc.text('4. The licensee may not claim copyright ownership of the track.')
    doc.text('5. This license is non-exclusive and non-transferable.')
    doc.moveDown()
    doc.text('For any questions about this license, please contact:')
    doc.text('contact@prodaibeats.com')

    doc.end()
  })
} 