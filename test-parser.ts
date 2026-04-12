import { parseResume } from "./server/resume-parser";
import { readFileSync } from "fs";

// Create a minimal test text (since we can't easily create a PDF)
const testText = `
John Doe
john@example.com | (555) 123-4567

WORK EXPERIENCE

Software Engineer
Google | New York, NY
January 2020 - Present
- Developed new features for search platform
- Led team of 5 engineers
- Improved performance by 40%

Senior Developer
Microsoft | Seattle, WA
June 2018 - December 2019
Responsible for cloud infrastructure
Managed database systems

EDUCATION

Bachelor of Science in Computer Science
MIT - Massachusetts Institute of Technology
2018

Master of Science in Software Engineering
Stanford University
2020
`;

// Test the parsing
const result = await parseResume(Buffer.from(testText));
console.log("Employment found:", result.employment.length);
console.log("Education found:", result.education.length);
console.log("\nEmployment:");
console.log(JSON.stringify(result.employment, null, 2));
console.log("\nEducation:");
console.log(JSON.stringify(result.education, null, 2));
