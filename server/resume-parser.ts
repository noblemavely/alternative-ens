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

  // More flexible patterns to match employment entries with various date formats
  const patterns = [
    // Pattern: "Company - Position | MM/YYYY - MM/YYYY"
    /([A-Z][A-Za-z\s&,\.()]*?)\s*[-–|]\s*([A-Z][A-Za-z\s,\.()]*?)\s*\|?\s*(?:from\s+)?(\d{1,2}\/\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})\s*(?:to\s+|-|–)?\s*(?:(\d{1,2}\/\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})|Present|Current|Today|Ongoing)/gi,
    // Pattern: "Position at Company" with dates
    /([A-Z][A-Za-z\s]*?)\s+at\s+([A-Z][A-Za-z\s&,\.()]*?)\s*[-–|]\s*(?:from\s+)?(\d{1,2}\/\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})\s*(?:to\s+|-|–)?\s*(?:(\d{1,2}\/\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})|Present|Current|Today|Ongoing)/gi,
    // Pattern: "Position, Company - Date range"
    /([A-Z][A-Za-z\s]*?),?\s+([A-Z][A-Za-z\s&,\.()]*?)\s*[-–]\s*(?:from\s+)?(\d{1,2}\/\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})\s*(?:to\s+|-|–)?\s*(?:(\d{1,2}\/\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})|Present|Current|Today|Ongoing)/gi,
  ];

  const lines = text.split('\n');
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length < 5) continue;

    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(line);

      if (match) {
        const companyName = match[2]?.trim() || '';
        const position = match[1]?.trim() || '';
        const startDate = match[3]?.trim() || '';
        const endDate = match[4]?.trim() || '';

        // Skip if we've already added this combination
        const key = `${companyName}|${position}`;
        if (seen.has(key) || !companyName || !position) continue;
        seen.add(key);

        const isCurrent = line.toLowerCase().includes('current') ||
                         line.toLowerCase().includes('present') ||
                         line.toLowerCase().includes('ongoing') ||
                         line.toLowerCase().includes('today') ||
                         !endDate;

        employment.push({
          companyName,
          position,
          startDate,
          endDate: endDate || '',
          isCurrent,
          description: '',
        });

        // Try to get description from following lines
        let desc = '';
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j].trim();
          if (nextLine && nextLine.length > 3 && !nextLine.match(/^[A-Z][a-z]*\s+\d{4}|^[A-Z][a-z]+,?\s+[A-Z]|^\d{1,2}\/\d{4}/)) {
            desc += nextLine + ' ';
          } else if (nextLine && nextLine.match(/^[A-Z][a-z]+\s+[A-Z]/)) {
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

  // More flexible patterns for education entries
  const patterns = [
    // Pattern: "Degree in Field of Study - School/University, Location (Year-Year)"
    /([A-Za-z\s,\.()&-]+?)\s+(?:in|of)\s+([A-Za-z\s,\.()&-]*?)\s*[-–]?\s*([A-Z][A-Za-z\s&,\.()]*?(?:University|School|College|Institute|Academy))\s*(?:,\s*[A-Za-z\s,]+?)?\s*(?:\((\d{4})[-–]?(\d{4})?\))?/gi,
    // Pattern: "School/University - Degree, Field (Year)"
    /([A-Z][A-Za-z\s&,\.()]*?(?:University|School|College|Institute|Academy))\s*(?:,\s*[A-Za-z\s,]+?)?\s*[-–]\s*([A-Za-z\s,\.()&-]+?)\s*(?:in|of|,)?\s*([A-Za-z\s,\.()&-]*?)\s*(?:\((\d{4})[-–]?(\d{4})?\))?/gi,
    // Pattern: "School - Degree" or "School\nDegree"
    /([A-Z][A-Za-z\s&,\.()]*?(?:University|School|College|Institute|Academy))\s*(?:[-–]\s*)?(?:\(([A-Za-z\s,\.()&-]+?)\))?\s*(?:\((\d{4})[-–]?(\d{4})?\))?/gi,
  ];

  const seen = new Set<string>();

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const schoolName = (match[1] || match[3])?.trim() || '';
      const degree = (match[2] || match[4])?.trim() || '';
      const fieldOfStudy = (match[3] || match[2])?.trim() || 'General Studies';
      const startDate = match[4] || match[5] || '';
      const endDate = match[5] || match[6] || '';

      // Skip if school name is too short or already added
      if (schoolName.length < 3) continue;

      const key = `${schoolName}|${degree}`;
      if (seen.has(key)) continue;
      seen.add(key);

      education.push({
        schoolName,
        degree: degree || 'Degree',
        fieldOfStudy: fieldOfStudy || 'General Studies',
        startDate: startDate?.toString() || '',
        endDate: endDate?.toString() || '',
        description: '',
      });
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
