import Anthropic from '@anthropic-ai/sdk';
import pdfParse from 'pdf-parse';
import { ENV } from './_core/env';

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
  firstName?: string;
  lastName?: string;
  phone?: string;
  linkedinUrl?: string;
  employment: ParsedEmployment[];
  education: ParsedEducation[];
  rawText: string;
}

/**
 * Extract text from PDF buffer using pdf-parse
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    const text = data.text;
    console.log('[Resume Parser] Successfully extracted text from PDF, length:', text.length);
    return text;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Resume Parser] Failed to extract text from PDF:', errorMessage);
    throw new Error(`Failed to extract text from PDF: ${errorMessage}`);
  }
}

/**
 * Parse resume using Claude API
 * This provides intelligent extraction that works with any resume format
 */
export async function parseResume(buffer: Buffer): Promise<ParsedResumeData> {
  let text = '';

  try {
    // Extract text from PDF
    text = await extractTextFromPDF(buffer);

    if (!ENV.claudeApiKey) {
      console.warn('[Resume Parser] Claude API key not configured, returning empty result');
      return {
        employment: [],
        education: [],
        rawText: text,
      };
    }

    // Use Claude API to intelligently extract data
    const client = new Anthropic({
      apiKey: ENV.claudeApiKey,
    });

    const prompt = `Extract personal, employment and education information from this resume text.

Return a JSON object with this exact structure:
{
  "firstName": "string (first name if found)",
  "lastName": "string (last name if found)",
  "phone": "string (phone number if found)",
  "linkedinUrl": "string (LinkedIn profile URL if found, should start with https://)",
  "employment": [
    {
      "companyName": "string",
      "position": "string",
      "startDate": "string (YYYY-MM or similar)",
      "endDate": "string (YYYY-MM or similar, or 'Present')",
      "isCurrent": boolean,
      "description": "string (key responsibilities/achievements)"
    }
  ],
  "education": [
    {
      "schoolName": "string",
      "degree": "string",
      "fieldOfStudy": "string",
      "startDate": "string (YYYY or YYYY-MM)",
      "endDate": "string (YYYY or YYYY-MM)",
      "description": "string (optional, e.g., GPA, honors)"
    }
  ]
}

Resume text:
${text}

Extract personal information (firstName, lastName, phone, LinkedIn URL), all employment positions, and education entries found in the resume. Be thorough and extract every position and degree mentioned. Return ONLY valid JSON, no additional text.`;

    // Use Sonnet-4 (cheaper than Opus, more capable than Haiku)
    // Your API key has access to: claude-sonnet-4-20250514
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    console.log(`[Resume Parser] Using model: claude-sonnet-4-20250514 (cost-optimized)`);

    // Extract the text content from the response
    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('');

    console.log('[Resume Parser] Claude response (first 200 chars):', responseText.substring(0, 200));

    // Parse the JSON response (handle markdown code blocks)
    let jsonString = responseText;

    // Remove markdown code blocks if present
    const codeBlockMatch = responseText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1];
    }

    // Extract JSON object
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[Resume Parser] No JSON found in Claude response');
      return {
        employment: [],
        education: [],
        rawText: text,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log('[Resume Parser] Successfully parsed - employment:', parsed.employment?.length, 'education:', parsed.education?.length);
    console.log('[Resume Parser] Raw employment sample:', JSON.stringify(parsed.employment?.[0]));
    console.log('[Resume Parser] Raw education sample:', JSON.stringify(parsed.education?.[0]));

    // Validate and clean the response
    const employment = (parsed.employment || []).filter((emp: any) => {
      const valid = emp.companyName && emp.position;
      if (!valid) {
        console.warn('[Resume Parser] Filtered out employment:', emp);
      }
      return valid;
    });
    const education = (parsed.education || []).filter((edu: any) => {
      const valid = edu.schoolName && edu.degree;
      if (!valid) {
        console.warn('[Resume Parser] Filtered out education:', edu);
      }
      return valid;
    });
    console.log('[Resume Parser] After filtering - employment:', employment.length, 'education:', education.length);

    return {
      firstName: parsed.firstName || undefined,
      lastName: parsed.lastName || undefined,
      phone: parsed.phone || undefined,
      linkedinUrl: parsed.linkedinUrl || undefined,
      employment: employment.map((emp: any) => ({
        companyName: emp.companyName || '',
        position: emp.position || '',
        startDate: emp.startDate || '',
        endDate: emp.endDate || '',
        isCurrent: emp.isCurrent || emp.endDate?.toLowerCase() === 'present' || false,
        description: emp.description || '',
      })),
      education: education.map((edu: any) => ({
        schoolName: edu.schoolName || '',
        degree: edu.degree || '',
        fieldOfStudy: edu.fieldOfStudy || '',
        startDate: edu.startDate || '',
        endDate: edu.endDate || '',
        description: edu.description || '',
      })),
      rawText: text,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Resume Parser] Error parsing resume:', errorMessage);

    // Check if this is an API availability error (model not found, quota exceeded, etc.)
    if (errorMessage.includes('404') || errorMessage.includes('not_found') || errorMessage.includes('quota') || errorMessage.includes('unavailable')) {
      console.warn('[Resume Parser] Claude API is not available (model not found or quota exceeded)');
      console.warn('[Resume Parser] Returning empty result - user can fill in data manually');
      return {
        employment: [],
        education: [],
        rawText: text,
      };
    }

    console.error('[Resume Parser] Unexpected error:', errorMessage);
    throw new Error(`Failed to parse resume: ${errorMessage}`);
  }
}
