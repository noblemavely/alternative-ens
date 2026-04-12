import { extractTextFromPDF } from "./server/resume-parser";
import { readFileSync } from "fs";

const resumePath = "/Users/noblemavely/Downloads/Resume - Noble Mavely - 2025 (1).pdf";
const buffer = readFileSync(resumePath);

const text = await extractTextFromPDF(buffer);
console.log(text);
