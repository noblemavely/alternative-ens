import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

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
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => (item.str || ''))
        .join(' ');
      fullText += pageText + '\n';
    }

    if (!fullText || fullText.trim().length === 0) {
      throw new Error('No text extracted from PDF');
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
  const seen = new Set<string>();

  // Find PROFESSIONAL EXPERIENCE or WORK EXPERIENCE section
  let experienceStart = -1;
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (/PROFESSIONAL\s+EXPERIENCE|WORK\s+EXPERIENCE|CAREER\s+HISTORY/i.test(lines[i])) {
      experienceStart = i + 1;
      break;
    }
  }

  if (experienceStart === -1) return employment;

  // Extract entries until next major section
  let currentCompany = '';
  let currentPosition = '';
  let currentStartDate = '';
  let currentEndDate = '';
  let currentIsCurrent = false;
  let currentDescription = '';

  for (let i = experienceStart; i < lines.length; i++) {
    const line = lines[i].trim();

    // Stop at next major section (all caps and minimum length)
    if (/^[A-Z\s]{4,}$/.test(line) && !line.includes('●') && line !== 'PROFESSIONAL EXPERIENCE' && line !== 'WORK EXPERIENCE') {
      // Save current entry if exists
      if (currentCompany && currentPosition) {
        const key = `${currentCompany}|${currentPosition}`;
        if (!seen.has(key)) {
          seen.add(key);
          employment.push({
            companyName: currentCompany,
            position: currentPosition,
            startDate: currentStartDate,
            endDate: currentEndDate,
            isCurrent: currentIsCurrent,
            description: currentDescription.trim(),
          });
        }
      }
      break;
    }

    // Company line: "Company Name, City (Description)"
    if (!line.includes('●') && line.includes(',') && !currentCompany && /^[A-Z].*[,(]/.test(line) && !/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/.test(line)) {
      currentCompany = line.split(/[,(]/)[0].trim();
      currentPosition = '';
      currentStartDate = '';
      currentEndDate = '';
      currentDescription = '';
    }

    // Job title line: "Title, Location   Date - Date"
    if (currentCompany && !currentPosition && line.includes('-') && /\d{4}|\w+\s+\d{4}/.test(line)) {
      const parts = line.split(/\s{2,}|\t/);
      currentPosition = parts[0].trim().replace(/^-\s*/, '');

      // Extract dates
      const dateMatch = /(\w+\s+\d{4}|\d{4})\s*[-–]\s*(\w+\s+\d{4}|Present|Current|\d{4})?/.exec(parts[parts.length - 1]);
      if (dateMatch) {
        currentStartDate = dateMatch[1] || '';
        currentEndDate = dateMatch[2] || '';
        currentIsCurrent = !dateMatch[2] || /Present|Current/i.test(dateMatch[2]);
      }
    }

    // Bullet points are description
    if (currentCompany && currentPosition && line.startsWith('●')) {
      currentDescription += line.substring(1).trim() + ' ';
    }

    // Empty line or next entry signals end of current job
    if (currentCompany && currentPosition && !line && !line.startsWith('●')) {
      const key = `${currentCompany}|${currentPosition}`;
      if (!seen.has(key)) {
        seen.add(key);
        employment.push({
          companyName: currentCompany,
          position: currentPosition,
          startDate: currentStartDate,
          endDate: currentEndDate,
          isCurrent: currentIsCurrent,
          description: currentDescription.trim().substring(0, 500),
        });
      }
      currentCompany = '';
      currentPosition = '';
    }
  }

  return employment;
}

/**
 * Parse education history from resume text
 */
function parseEducationHistory(text: string): ParsedEducation[] {
  const education: ParsedEducation[] = [];
  const seen = new Set<string>();

  // Find EDUCATION section
  let educationStart = -1;
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (/^EDUCATION/i.test(lines[i])) {
      educationStart = i + 1;
      break;
    }
  }

  if (educationStart === -1) return education;

  // Parse entries
  let currentDegree = '';
  let currentSchool = '';
  let currentStartYear = '';
  let currentEndYear = '';

  for (let i = educationStart; i < lines.length; i++) {
    const line = lines[i].trim();

    // Stop at next section
    if (/^[A-Z\s]{4,}$/.test(line) && !line.includes('●') && line !== 'EDUCATION') {
      // Save current entry
      if (currentDegree && currentSchool) {
        const key = `${currentSchool}|${currentDegree}`;
        if (!seen.has(key)) {
          seen.add(key);
          education.push({
            schoolName: currentSchool,
            degree: currentDegree,
            fieldOfStudy: extractFieldOfStudy(currentDegree),
            startDate: currentStartYear,
            endDate: currentEndYear,
            description: '',
          });
        }
      }
      break;
    }

    if (!line) continue;

    // Degree line with years: "Degree (Subjects)   Year - Year" or "Degree   Year - Year"
    const degreePattern = /([A-Za-z\s&,\.]+?(?:Degree|Certificate|Diploma|BS|BA|MA|MS|MBA|PhD|BTech|BCA|HSC|SSC)(?:\s+[A-Za-z\s&,\.()]*)?)\s*(?:\(([A-Za-z\s,\.&-]*?)\))?\s*(\d{4})\s*[-–]\s*(\d{4})?/i;
    const degreeMatch = degreePattern.exec(line);

    if (degreeMatch) {
      currentDegree = degreeMatch[1]?.trim() || '';
      currentStartYear = degreeMatch[3] || '';
      currentEndYear = degreeMatch[4] || '';
      // School name should be on next line
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1]?.trim();
        if (nextLine && !degreePattern.test(nextLine)) {
          currentSchool = nextLine;
          i++; // Skip school line

          // Save entry
          if (currentDegree && currentSchool) {
            const key = `${currentSchool}|${currentDegree}`;
            if (!seen.has(key)) {
              seen.add(key);
              education.push({
                schoolName: currentSchool,
                degree: currentDegree,
                fieldOfStudy: extractFieldOfStudy(currentDegree),
                startDate: currentStartYear,
                endDate: currentEndYear,
                description: '',
              });
            }
          }
          currentDegree = '';
          currentSchool = '';
          currentStartYear = '';
          currentEndYear = '';
        }
      }
    }
  }

  return education;
}

/**
 * Extract field of study from degree text
 */
function extractFieldOfStudy(degreeText: string): string {
  // Look for "in X" or "of X" pattern
  const match = /(?:in|of)\s+([A-Za-z\s&,\.]+?)(?:\s*[-,]|$)/i.exec(degreeText);
  if (match) {
    return match[1].trim();
  }
  // Look for content in parentheses
  const parenMatch = /\(([A-Za-z\s,&\.]+)\)/.exec(degreeText);
  if (parenMatch) {
    return parenMatch[1].trim();
  }
  return 'General Studies';
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
