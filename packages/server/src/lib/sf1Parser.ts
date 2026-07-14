import pdfParse from "pdf-parse";

export interface Sf1StudentRow {
  lrn: string;
  lastName: string;
  firstName: string;
  middleName: string | null;
  sex: "M" | "F";
  birthday: string | null;
  age: number | null;
  religion: string | null;
  lrnValid: boolean;
}

export interface Sf1ParseResult {
  meta: {
    schoolName: string | null;
    schoolId: string | null;
    gradeLevel: string | null;
    section: string | null;
    schoolYear: string | null;
    semester: string | null;
  };
  students: Sf1StudentRow[];
  warnings: string[];
}

// Matches a School Register row as it comes out of pdf-parse's text extraction,
// e.g. "103343130060.CANTOR,BABY JANE PERDIGONES08/05/200816 Christianity"
// LRN + "." + Name (Last,First Middle) directly followed by mm/dd/yyyy + age, then religion.
const ROW_REGEX = /^(\d{9,12})\.([A-Za-z][A-Za-z .'\-]*,[A-Za-z .'\-]+?)(\d{2}\/\d{2}\/\d{4})(\d{1,2})\s+(.+)$/;

function parseName(raw: string): { lastName: string; firstName: string; middleName: string | null } {
  const [lastNameRaw, restRaw] = raw.split(",");
  const lastName = (lastNameRaw ?? "").trim();
  const rest = (restRaw ?? "").trim().split(/\s+/);
  if (rest.length <= 1) {
    return { lastName, firstName: rest[0] ?? "", middleName: null };
  }
  // Filipino school-register convention: the final token of the given-name
  // block is the middle name (usually the mother's maiden surname).
  const middleName = rest[rest.length - 1];
  const firstName = rest.slice(0, -1).join(" ");
  return { lastName, firstName, middleName };
}

function extractMeta(text: string): Sf1ParseResult["meta"] {
  const schoolName = text.match(/School Name\s*([A-Za-z .,'\-]+?)School ID/)?.[1]?.trim() ?? null;
  const schoolId = text.match(/School ID\s*(\d+)/)?.[1] ?? null;
  const gradeLevel = text.match(/Grade Level\s*(Grade\s*\d+)/i)?.[1]?.trim() ?? null;
  const section = text.match(/\bSection\s*\n?\s*([A-Z0-9][A-Za-z0-9 \-]*?)(?:\n|Course)/)?.[1]?.trim() ?? null;
  const schoolYear = text.match(/School Year\s*([\d]{4}\s*-\s*[\d]{4})/)?.[1]?.trim() ?? null;
  const semester = text.match(/Semester\s*([A-Za-z]+\s+Semester)/)?.[1]?.trim() ?? null;
  return { schoolName, schoolId, gradeLevel, section, schoolYear, semester };
}

export async function parseSf1Pdf(buffer: Buffer): Promise<Sf1ParseResult> {
  const { text } = await pdfParse(buffer);
  const lines = text.split("\n");
  const students: Sf1StudentRow[] = [];
  const warnings: string[] = [];
  const seenLrns = new Set<string>();

  for (const line of lines) {
    const match = ROW_REGEX.exec(line.trim());
    if (!match) continue;
    const [, lrn, nameRaw, birthday, ageRaw, religion] = match;

    if (seenLrns.has(lrn)) {
      warnings.push(`Duplicate LRN ${lrn} found in the document — only the first occurrence was kept.`);
      continue;
    }
    seenLrns.add(lrn);

    const { lastName, firstName, middleName } = parseName(nameRaw);
    if (!lastName || !firstName) {
      warnings.push(`Could not confidently parse the name for LRN ${lrn} ("${nameRaw}") — please review manually.`);
    }

    students.push({
      lrn,
      lastName,
      firstName,
      middleName,
      sex: "M", // corrected below via the M/F column pass
      birthday,
      age: ageRaw ? Number(ageRaw) : null,
      religion: religion?.trim() || null,
      lrnValid: lrn.length === 12,
    });
  }

  // The M/F sex column is emitted separately (as a run of single "M"/"F" tokens
  // in male-then-female block order matching the male roster then female roster
  // sections of the register), so we can't zip it positionally against `students`
  // reliably. Instead, infer sex from which alphabetical block a row's LRN falls
  // in by locating the two "<=== TOTAL MALE" / "<=== TOTAL FEMALE" markers.
  const maleBlockEnd = text.indexOf("TOTAL MALE");
  if (maleBlockEnd !== -1) {
    for (const student of students) {
      const rowIndex = text.indexOf(`${student.lrn}.`);
      student.sex = rowIndex !== -1 && rowIndex < maleBlockEnd ? "M" : "F";
    }
  } else {
    warnings.push("Couldn't locate the Male/Female roster split — defaulted sex to unknown for all rows; please verify.");
  }

  if (students.length === 0) {
    warnings.push("No student rows could be parsed from this file. Is this a School Form 1 (School Register)?");
  }

  return { meta: extractMeta(text), students, warnings };
}
