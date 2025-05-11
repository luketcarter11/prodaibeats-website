import jsPDF from 'jspdf';
import path from 'path';
import fs from 'fs';

export type LicenseType = 'Non-Exclusive' | 'Non-Exclusive Plus' | 'Exclusive' | 'Exclusive Plus' | 'Exclusive Pro';

interface LicenseDetails {
  licenseType: LicenseType;
  trackTitle: string;
  effectiveDate: string;
  orderId: string;
}

const LICENSE_TEMPLATES: Record<LicenseType, string> = {
  'Non-Exclusive': `PROD AI NON-EXCLUSIVE LICENSE AGREEMENT
License Name: Non-Exclusive

Track Title: [trackTitle]

Producer: Prod AI

Effective Date: [effectiveDate]

1. Agreement Overview
This License Agreement ("Agreement") is made and entered into by and between Prod AI ("Licensor") and the purchaser of this license ("Licensee"), effective as of the date of purchase. This Agreement sets forth the terms under which the Licensee is permitted to use the musical composition identified as "[trackTitle]" (the "Beat").

2. Grant of License
Licensor hereby grants Licensee a limited, non-exclusive, non-transferable, and non-sublicensable license to use the Beat for the creation of one (1) new musical composition (the "New Song"), subject to the terms outlined below.

3. Rights Granted
• Use of the Beat on all platforms (Spotify, Apple Music, YouTube, etc.)
• Up to 100,000 combined audio or video streams
• Unlimited non-profit performances
• Unlimited downloads and physical sales
• Synchronization rights for any length or usage including music videos
• Permission to modify the Beat (tempo, pitch, length) to create the New Song

4. Limitations
• The License is non-exclusive. The same Beat may be licensed to other users.
• Licensee may not copyright or register the Beat itself or the New Song in a way that restricts Licensor's continued use or sale of the Beat.
• Licensee must not resell, lease, sublicense, or otherwise redistribute the Beat or New Song as a standalone item.
• Beat cannot be used for sampling by third parties.
• The Beat or New Song must not be registered with any content ID system, digital aggregator, or copyright enforcement service.

5. Ownership
• Licensor retains all rights, title, and interest in and to the Beat, including the master and composition.
• Licensee owns the lyrics and vocal performance in the New Song but not the instrumental Beat.
• The resulting New Song is considered a derivative work under copyright law.

6. Royalty Split
The underlying composition of the New Song will be co-owned as follows:
• 50% Licensor (Prod AI)
• 50% Licensee (Purchaser)

Licensee must credit this split when registering the New Song with a Performing Rights Organization (PRO).`,

  'Non-Exclusive Plus': `PROD AI NON-EXCLUSIVE PLUS LICENSE AGREEMENT
License Name: Non-Exclusive Plus

Track Title: [trackTitle]

Producer: Prod AI

Effective Date: [effectiveDate]

1. Agreement Overview
This License Agreement ("Agreement") is made and entered into by and between Prod AI ("Licensor") and the purchaser of this license ("Licensee"), effective as of the date of purchase. This Agreement sets forth the terms under which the Licensee is permitted to use the musical composition identified as "[trackTitle]" (the "Beat").

2. Grant of License
Licensor hereby grants Licensee a limited, non-exclusive, non-transferable, and non-sublicensable license to use the Beat for the creation of one (1) new musical composition (the "New Song"), subject to the terms outlined below.

3. Rights Granted
• Use of the Beat on all platforms (Spotify, Apple Music, YouTube, etc.)
• Unlimited combined audio and video streams
• Unlimited non-profit performances
• Unlimited downloads and physical sales
• Synchronization rights for any length or usage, including music videos
• Permission to modify the Beat (tempo, pitch, length) to create the New Song

4. Limitations
• The License is non-exclusive. The same Beat may be licensed to other users.
• Licensee may not copyright or register the Beat itself or the New Song in a way that restricts Licensor's continued use or sale of the Beat.
• Licensee must not resell, lease, sublicense, or otherwise redistribute the Beat or New Song as a standalone item.
• Beat cannot be used for sampling by third parties.
• The Beat or New Song must not be registered with any content ID system, digital aggregator, or copyright enforcement service.

5. Ownership
• Licensor retains all rights, title, and interest in and to the Beat, including the master and composition.
• Licensee owns the lyrics and vocal performance in the New Song but not the instrumental Beat.
• The resulting New Song is considered a derivative work under copyright law.

6. Royalty Split
The underlying composition of the New Song will be co-owned as follows:
• 60% Licensor (Prod AI)
• 40% Licensee (Purchaser)

Licensee must credit this split when registering the New Song with a Performing Rights Organization (PRO).`,

  'Exclusive': `PROD AI EXCLUSIVE LICENSE AGREEMENT
License Name: Exclusive

Track Title: [trackTitle]

Producer: Prod AI

Effective Date: [effectiveDate]

1. Agreement Overview
This License Agreement ("Agreement") is made and entered into by and between Prod AI ("Licensor") and the purchaser of this license ("Licensee"), effective as of the date of purchase. This Agreement outlines the rights granted to Licensee for the use of the musical composition titled "[trackTitle]" (the "Beat").

2. Grant of License
Licensor hereby grants Licensee a limited, exclusive, non-transferable, and non-sublicensable license to use the Beat for the creation of one (1) new musical composition (the "New Song"), subject to the terms and conditions stated herein. Upon purchase, this Beat will be removed from future licensing to any additional parties.

3. Rights Granted
• Use of the Beat on all platforms (Spotify, Apple Music, YouTube, etc.)
• Up to 100,000 combined audio and video streams
• Unlimited non-profit performances
• Unlimited downloads and physical sales
• Synchronization rights for any length or usage, including music videos
• Permission to modify the Beat (tempo, pitch, arrangement, etc.)
• Exclusive rights — no future licenses of the same Beat will be issued

4. Limitations
• The License is exclusive. The same Beat may not be licensed to other users.
• Licensee may not copyright or register the Beat itself or the New Song in a way that restricts Licensor's continued use or sale of the Beat.
• Licensee must not resell, lease, sublicense, or otherwise redistribute the Beat or New Song as a standalone item.
• Beat cannot be used for sampling by third parties.
• The Beat or New Song must not be registered with any content ID system, digital aggregator, or copyright enforcement service.

5. Ownership
• Licensor retains all rights, title, and interest in and to the Beat, including the master and composition.
• Licensee owns the lyrics and vocal performance in the New Song but not the instrumental Beat.
• The resulting New Song is considered a derivative work under copyright law.

6. Royalty Split
The underlying composition of the New Song will be co-owned as follows:
• 100% Licensor (Prod AI)

Licensee must credit this split when registering the New Song with a Performing Rights Organization (PRO).`,

  'Exclusive Plus': `PROD AI EXCLUSIVE PLUS LICENSE AGREEMENT
License Name: Exclusive Plus

Track Title: [trackTitle]

Producer: Prod AI

Effective Date: [effectiveDate]

1. Agreement Overview
This License Agreement ("Agreement") is made and entered into by and between Prod AI ("Licensor") and the purchaser of this license ("Licensee"), effective as of the date of purchase. This Agreement grants the Licensee exclusive usage rights for the musical composition titled "[trackTitle]" (the "Beat"), subject to the terms and conditions set forth herein.

2. Grant of License
Licensor hereby grants Licensee a limited, exclusive, non-transferable, and non-sublicensable license to use the Beat for the creation of one (1) new musical composition (the "New Song"), subject to the terms and conditions set forth herein. Upon purchase, this Beat will be removed from future licensing to any additional parties.

3. Rights Granted
• Use of the Beat on all platforms (Spotify, Apple Music, YouTube, etc.)
• Up to 100,000 combined audio and video streams
• Unlimited non-profit performances
• Unlimited downloads and physical sales
• Synchronization rights for any length or usage, including music videos
• Permission to modify the Beat (tempo, pitch, length) to create the New Song

4. Limitations
• The License is exclusive. The same Beat may not be licensed to other users.
• Licensee may not copyright or register the Beat itself or the New Song in a way that restricts Licensor's continued use or sale of the Beat.
• Licensee must not resell, lease, sublicense, or otherwise redistribute the Beat or New Song as a standalone item.
• Beat cannot be used for sampling by third parties.
• The Beat or New Song must not be registered with any content ID system, digital aggregator, or copyright enforcement service.

5. Ownership
• Licensor retains all rights, title, and interest in and to the Beat, including the master and composition.
• Licensee owns the lyrics and vocal performance in the New Song but not the instrumental Beat.
• The resulting New Song is considered a derivative work under copyright law.

6. Royalty Split
The underlying composition of the New Song will be co-owned as follows:
• 100% Licensor (Prod AI)

Licensee must credit this split when registering the New Song with a Performing Rights Organization (PRO).`,

  'Exclusive Pro': `PROD AI EXCLUSIVE PRO LICENSE AGREEMENT
License Name: Exclusive Pro

Track Title: [trackTitle]

Producer: Prod AI

Effective Date: [effectiveDate]

1. Agreement Overview
This License Agreement ("Agreement") is made and entered into by and between Prod AI ("Licensor") and the purchaser of this license ("Licensee"), effective as of the date of purchase. This Agreement grants the Licensee exclusive usage rights for the musical composition titled "[trackTitle]" (the "Beat"), subject to the terms and conditions set forth herein.

2. Grant of License
Licensor hereby grants Licensee a limited, exclusive, non-transferable, and non-sublicensable license to use the Beat for the creation of one (1) new musical composition (the "New Song"), subject to the terms and conditions set forth herein. Upon purchase, this Beat will be removed from future licensing to any additional parties.

3. Rights Granted
• Use of the Beat on all platforms (Spotify, Apple Music, YouTube, etc.)
• Up to 100,000 combined audio and video streams
• Unlimited non-profit performances
• Unlimited downloads and physical sales
• Synchronization rights for any length or usage, including music videos
• Permission to modify the Beat (tempo, pitch, length) to create the New Song

4. Limitations
• The License is exclusive. The same Beat may not be licensed to other users.
• Licensee may not copyright or register the Beat itself or the New Song in a way that restricts Licensor's continued use or sale of the Beat.
• Licensee must not resell, lease, sublicense, or otherwise redistribute the Beat or New Song as a standalone item.
• Beat cannot be used for sampling by third parties.
• The Beat or New Song must not be registered with any content ID system, digital aggregator, or copyright enforcement service.

5. Ownership
• Licensor retains all rights, title, and interest in and to the Beat, including the master and composition.
• Licensee owns the lyrics and vocal performance in the New Song but not the instrumental Beat.
• The resulting New Song is considered a derivative work under copyright law.

6. Royalty Split
The underlying composition of the New Song will be co-owned as follows:
• 100% Licensor (Prod AI)

Licensee must credit this split when registering the New Song with a Performing Rights Organization (PRO).`
};

// Add custom fonts to jsPDF - this works differently in browser vs Node.js
const setupFonts = (doc: jsPDF) => {
  try {
    // Log the jsPDF version
    console.log('jsPDF version:', (doc as any).version);
    
    // For Node.js server environment, jsPDF has built-in standard fonts
    // We'll enhance the PDF with styles using the available fonts
    
    // For normal text, use helvetica
    doc.setFont('helvetica', 'normal');
    console.log('Set default font to helvetica normal');
    
    // Test if bold variant is available
    try {
      doc.setFont('helvetica', 'bold');
      console.log('Helvetica bold font is available');
      doc.setFont('helvetica', 'normal'); // Reset to normal
    } catch (boldError) {
      console.log('Helvetica bold font not available:', boldError);
    }
    
    return true;
  } catch (error) {
    console.error('Error setting up fonts:', error);
    return false;
  }
};

// Helper function to add a styled header to the PDF
const addDocumentHeader = (doc: jsPDF, details: LicenseDetails) => {
  // Add a subtle background color for the header
  doc.setFillColor(240, 240, 240);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Add a border line
  doc.setDrawColor(200, 200, 200);
  doc.line(10, 40, 200, 40);
  
  // Add title with styling
  doc.setFontSize(18);
  try {
    doc.setFont('helvetica', 'bold');
  } catch (e) {
    console.log('Could not set bold font for title');
  }
  
  // Set text color to dark gray
  doc.setTextColor(50, 50, 50);
  doc.text(`${details.licenseType.toUpperCase()} LICENSE`, 105, 20, { align: 'center' });
  
  // Add subtitle
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('PROD AI BEATS', 105, 30, { align: 'center' });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  try {
    doc.setFont('helvetica', 'normal');
  } catch (e) {
    console.log('Could not reset font after title');
  }
};

// Helper to format sections with proper styling
const formatSection = (doc: jsPDF, title: string, content: string, startY: number): number => {
  let y = startY;
  
  // Add section title with styling
  doc.setFontSize(12);
  try {
    doc.setFont('helvetica', 'bold');
  } catch (e) {
    console.log('Could not set bold font for section title');
  }
  
  doc.text(title, 20, y);
  y += 6;
  
  try {
    doc.setFont('helvetica', 'normal');
  } catch (e) {
    console.log('Could not reset font after section title');
  }
  
  doc.setFontSize(10);
  
  // Add section content
  const wrappedText = doc.splitTextToSize(content, 170);
  doc.text(wrappedText, 20, y);
  y += 5 * wrappedText.length + 5; // Add some extra padding
  
  return y;
};

export async function generateLicensePDF(details: LicenseDetails): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Starting PDF generation with jsPDF...');
      
      // Create a new jsPDF instance
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Setup fonts
      const fontsSetup = setupFonts(doc);
      console.log('Fonts setup result:', fontsSetup ? 'Success' : 'Fallback to defaults');
      
      // Get the template for this license type
      const template = LICENSE_TEMPLATES[details.licenseType];
      if (!template) {
        throw new Error(`No template found for license type: ${details.licenseType}`);
      }

      // Replace placeholders with actual values
      const content = template
        .replace(/\[trackTitle\]/g, details.trackTitle)
        .replace(/\[effectiveDate\]/g, details.effectiveDate);
      
      // Add PDF metadata
      doc.setProperties({
        title: `${details.licenseType} License for ${details.trackTitle}`,
        subject: 'Beat License Agreement',
        author: 'Prod AI',
        keywords: 'license, music, beat, agreement, prod ai',
        creator: 'Prod AI Licensing System'
      });
      
      // Add styled header
      addDocumentHeader(doc, details);
      
      // Add license metadata section
      let y = 50;
      
      // Create a metadata table
      doc.setFillColor(245, 245, 245);
      doc.rect(20, y, 170, 30, 'F');
      
      y += 5;
      doc.setFontSize(10);
      doc.text(`Track Title: ${details.trackTitle}`, 25, y);
      y += 7;
      doc.text(`License Type: ${details.licenseType}`, 25, y);
      y += 7;
      doc.text(`Effective Date: ${details.effectiveDate}`, 25, y);
      y += 7;
      doc.text(`Order ID: ${details.orderId}`, 25, y);
      y += 15;
      
      // Split content into sections
      const sections = content.split('\n\n');
      
      // Process the sections that have headers (numbered sections)
      let currentSectionTitle = "";
      let currentSectionContent = "";
      
      for (const section of sections) {
        // Headers with numbers (1., 2., etc.)
        if (/^\d+\./.test(section)) {
          // If we have a previous section to render
          if (currentSectionTitle) {
            y = formatSection(doc, currentSectionTitle, currentSectionContent, y);
            
            // Check if we need a new page
            if (y > 270) {
              doc.addPage();
              y = 20;
            }
          }
          
          // Extract the section title and content
          const lines = section.split('\n');
          currentSectionTitle = lines[0];
          currentSectionContent = lines.slice(1).join('\n');
        } 
        // Handle bullet points or continue current section
        else if (section.includes('• ')) {
          // Bullet points get added to current section
          currentSectionContent += '\n\n' + section;
        }
        // Regular paragraphs
        else {
          // If we haven't started a section yet, this might be the intro
          if (!currentSectionTitle) {
            doc.setFontSize(10);
            const wrappedText = doc.splitTextToSize(section, 170);
            doc.text(wrappedText, 20, y);
            y += 5 * wrappedText.length + 5;
          } else {
            // Otherwise, add to current section
            currentSectionContent += '\n\n' + section;
          }
        }
      }
      
      // Don't forget to add the last section
      if (currentSectionTitle) {
        y = formatSection(doc, currentSectionTitle, currentSectionContent, y);
      }
      
      // Add signature section
      y += 10;
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
      
      // Add signature boxes
      doc.setDrawColor(150, 150, 150);
      doc.setFillColor(250, 250, 250);
      
      // Licensor signature
      doc.rect(20, y, 75, 25, 'FD');
      doc.setFontSize(10);
      doc.text('Licensor: Prod AI', 22, y + 5);
      
      // Licensee signature
      doc.rect(115, y, 75, 25, 'FD');
      doc.setFontSize(10);
      doc.text('Licensee:', 117, y + 5);
      
      // Add date line
      y += 35;
      doc.text(`Date: ${details.effectiveDate}`, 20, y);
      
      // Add footer with page numbers
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${i} of ${pageCount} - Prod AI License Agreement`, 105, 290, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      }
      
      // Get PDF as buffer
      const pdfOutput = doc.output('arraybuffer');
      resolve(Buffer.from(pdfOutput));
      
    } catch (error) {
      console.error('Error in jsPDF generation:', error);
      reject(error);
    }
  });
} 