import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker
if (typeof window === 'undefined') {
  // For Node.js/server-side
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export interface ParsedEmployment {
  companyName: string;
  position: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

export interface ParsedEducation {
  schoolName: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface ParsedResumeData {
  employment: ParsedEmployment[];
  education: ParsedEducation[];
  rawText: string;
}

/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Parse employment history from resume text
 */
function parseEmploymentHistory(text: string): ParsedEmployment[] {
  const employment: ParsedEmployment[] = [];

  // Patterns to match employment entries
  const patterns = [
    // Pattern: "Company Name - Position (MM/YYYY - MM/YYYY)"
    /([A-Z][A-Za-z\s&,]*?)\s*[-–]\s*([A-Z][A-Za-z\s,]*?)\s*\((\d{1,2}\/\d{4})\s*[-–]\s*(?:(\d{1,2}\/\d{4})|Present|Current)\)/gi,
    // Pattern: "Position at Company"
    /([A-Z][A-Za-z\s]*?)\s+at\s+([A-Z][A-Za-z\s&,]*?)\s*\((\d{1,2}\/\d{4})\s*[-–]\s*(?:(\d{1,2}\/\d{4})|Present|Current)\)/gi,
  ];

  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(line);

      if (match) {
        const isCurrent = line.toLowerCase().includes('current') ||
                         line.toLowerCase().includes('present') ||
                         !match[4];

        employment.push({
          companyName: match[2].trim(),
          position: match[1].trim(),
          startDate: match[3],
          endDate: match[4] || '',
          isCurrent,
          description: '', // Description from next lines
        });

        // Try to get description from following lines
        let desc = '';
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          const nextLine = lines[j].trim();
          if (nextLine && !nextLine.match(/^[A-Z]/)) {
            desc += nextLine + ' ';
          } else {
            break;
          }
        }
        if (employment[employment.length - 1]) {
          employment[employment.length - 1].description = desc.trim();
        }
      }
    }
  }

  return employment;
}

/**
 * Parse education history from resume text
 */
function parseEducationHistory(text: string): ParsedEducation[] {
  const education: ParsedEducation[] = [];

  // Patterns to match education entries
  const patterns = [
    // Pattern: "Degree in Field of Study - School/University (Year)"
    /([A-Za-z\s,\.]+?)\s+(?:in|of)\s+([A-Za-z\s,]*?)\s*[-–]?\s*([A-Z][A-Za-z\s&,]*?(?:University|School|College|Institute))\s*(?:\((\d{4})[-–]?(\d{4})?\))?/gi,
    // Pattern: "School/University - Degree (Year)"
    /([A-Z][A-Za-z\s&,]*?(?:University|School|College|Institute))\s*[-–]\s*([A-Za-z\s,\.]+?)\s*(?:\((\d{4})[-–]?(\d{4})?\))?/gi,
  ];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      // Avoid duplicates
      const isDuplicate = education.some(
        e => e.schoolName === match[3] && e.degree === match[1]
      );

      if (!isDuplicate) {
        education.push({
          schoolName: (match[3] || match[1]).trim(),
          degree: (match[1] || match[2]).trim(),
          fieldOfStudy: (match[2] || match[1]).trim(),
          startDate: match[3] || match[4] || '',
          endDate: match[4] || match[5] || '',
          description: '',
        });
      }
    }
  }

  return education;
}

/**
 * Parse resume data from PDF buffer
 */
export async function parseResume(buffer: Buffer): Promise<ParsedResumeData> {
  try {
    const text = await extractTextFromPDF(buffer);

    const employment = parseEmploymentHistory(text);
    const education = parseEducationHistory(text);

    return {
      employment,
      education,
      rawText: text,
    };
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw new Error('Failed to parse resume');
  }
}
