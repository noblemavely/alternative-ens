import { PDFParse } from 'pdf-parse';
import { readFileSync } from "fs";

const resumePath = "/Users/noblemavely/Downloads/Resume - Noble Mavely - 2025 (1).pdf";
const buffer = readFileSync(resumePath);

console.log("Testing pdf-parse...");
const pdfParser = new PDFParse({});
const result = await pdfParser.getText({ pageNumbers: [] });
console.log("Text result:", result.text.substring(0, 500));
