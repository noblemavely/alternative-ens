import { parseResume, extractTextFromPDF } from "./server/resume-parser";
import { readFileSync } from "fs";
import { resolve } from "path";

const resumePath = "/Users/noblemavely/Downloads/Resume - Noble Mavely - 2025 (1).pdf";
const buffer = readFileSync(resumePath);

console.log(`Testing with resume: ${resumePath}`);
console.log(`File size: ${buffer.length} bytes\n`);

try {
  // First test text extraction
  console.log("=== Step 1: Extracting text from PDF ===");
  const text = await extractTextFromPDF(buffer);
  console.log(`Extracted text length: ${text.length} characters`);
  console.log(`First 500 characters:\n${text.substring(0, 500)}\n`);

  // Then test full parsing
  console.log("=== Step 2: Parsing resume ===");
  const result = await parseResume(buffer);

  console.log(`Employment entries found: ${result.employment.length}`);
  console.log(`Education entries found: ${result.education.length}\n`);

  if (result.employment.length > 0) {
    console.log("Employment:");
    result.employment.forEach((emp, i) => {
      console.log(`  ${i + 1}. ${emp.position} at ${emp.companyName}`);
      console.log(`     ${emp.startDate} - ${emp.endDate || "Present"}`);
    });
  } else {
    console.log("No employment entries found");
  }

  console.log();

  if (result.education.length > 0) {
    console.log("Education:");
    result.education.forEach((edu, i) => {
      console.log(`  ${i + 1}. ${edu.degree} in ${edu.fieldOfStudy}`);
      console.log(`     ${edu.schoolName}`);
    });
  } else {
    console.log("No education entries found");
  }
} catch (error: any) {
  console.error("Error:", error.message);
}
