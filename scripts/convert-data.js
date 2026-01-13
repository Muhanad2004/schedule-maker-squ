import fs from 'fs';
import path from 'path';
import * as XLSX_Module from 'xlsx';
import { fileURLToPath } from 'url';

// Handle ESM/CommonJS interop for XLSX
const XLSX = XLSX_Module.default || XLSX_Module;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAW_DATA_DIR = path.join(__dirname, '../raw-data');
const OUTPUT_FILE = path.join(__dirname, '../public/data.json');

function convertData() {
    if (!fs.existsSync(RAW_DATA_DIR)) {
        console.error(`Directory not found: ${RAW_DATA_DIR}`);
        process.exit(1);
    }

    const allFiles = fs.readdirSync(RAW_DATA_DIR);
    // Find English files as the base
    const englishFiles = allFiles.filter(file =>
        (file.endsWith('_en.xls') || file.endsWith('_en.xlsx')) && !file.startsWith('~$')
    );

    if (englishFiles.length === 0) {
        console.warn('No English Excel files found in raw-data directory.');
        return;
    }

    let allCourses = [];

    englishFiles.forEach(enFile => {
        // Find corresponding Arabic file
        // Assumption: filename structure is "name_en.xls" -> "name_ar.xls"
        const ext = path.extname(enFile);
        const baseName = enFile.substring(0, enFile.lastIndexOf('_en'));
        const arFile = `${baseName}_ar${ext}`;

        const enPath = path.join(RAW_DATA_DIR, enFile);
        const arPath = path.join(RAW_DATA_DIR, arFile);

        console.log(`Processing Pair: ${enFile} + ${fs.existsSync(arPath) ? arFile : '(No Arabic Match)'}`);

        // Determine Course Type
        let courseType = null;
        if (enFile.toLowerCase().includes('university_requirements')) courseType = 'UR';
        if (enFile.toLowerCase().includes('university_electives')) courseType = 'UE';

        // Read Data
        const enRows = readExcelFile(enPath);
        const arRows = fs.existsSync(arPath) ? readExcelFile(arPath) : [];

        // Merge
        const mergedCourses = mergeData(enRows, arRows, courseType);
        allCourses = allCourses.concat(mergedCourses);
    });

    const finalData = consolidateCourses(allCourses);

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalData, null, 2));
    console.log(`Data converted successfully! Saved to ${OUTPUT_FILE}`);
}

function readExcelFile(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (rows.length === 0) return [];

    let headerRowIndex = -1;
    let columnIndices = {};

    // Find header row
    for (let i = 0; i < Math.min(rows.length, 25); i++) {
        const rowStr = rows[i].map(c => String(c).toLowerCase()).join(' ');
        if ((rowStr.includes('course') && (rowStr.includes('code') || rowStr.includes('title'))) ||
            (rowStr.includes('رمز') && rowStr.includes('المقرر'))) {

            headerRowIndex = i;
            rows[i].forEach((cell, idx) => {
                const val = String(cell).toLowerCase().trim();
                // Basic clean mapping
                if (val.includes('code') || val.includes('رمز')) columnIndices.code = idx;
                else if (val.includes('name') || val.includes('title') || val.includes('اسم')) columnIndices.name = idx;
                else if (val.includes('titie')) columnIndices.name = idx; // Common typo in SQU files
                else if (val.includes('sect') || val.includes('شعبة')) columnIndices.section = idx;
                else if (val.includes('instructor') || val.includes('محاضر') || val.includes('مدرس')) columnIndices.instructor = idx;
                else if (val.includes('day') || val.includes('يوم') || val.includes('أيام')) columnIndices.day = idx;
                else if (val.includes('from') || val.includes('من')) columnIndices.from = idx;
                else if (val.includes('to') || val.includes('إلى') || val.includes('الى')) columnIndices.to = idx;
                else if (val.includes('hall') || val.includes('room') || val.includes('قاعة')) columnIndices.room = idx;
                else if (val.includes('exam') || val.includes('امتحان') || val.includes('اختبار')) columnIndices.exam = idx;
            });
            break;
        }
    }

    if (headerRowIndex === -1) {
        console.warn(`Could not find header row in ${path.basename(filePath)}`);
        return [];
    }

    const cleanedRows = [];
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const code = row[columnIndices.code];
        if (!code || String(code).toLowerCase().includes('course code')) continue;

        const day = String(row[columnIndices.day] || '').trim();
        const from = String(row[columnIndices.from] || '').trim();
        const to = String(row[columnIndices.to] || '').trim();
        const timeStr = (day && from && to) ? `${day} ${from}-${to}` : '';

        cleanedRows.push({
            code: String(code).trim(),
            name: String(row[columnIndices.name] || '').trim(),
            section: String(row[columnIndices.section] || '').trim(),
            instructor: String(row[columnIndices.instructor] || 'To Be Announced').trim(),
            time: timeStr,
            room: String(row[columnIndices.room] || '').trim(),
            exam: String(row[columnIndices.exam] || '').trim()
        });
    }

    return cleanedRows;
}

function mergeData(enRows, arRows, type) {
    // Map Arabic rows by Code + Section for easy lookup
    // Note: Sometimes section numbers might formatting diffs (01 vs 1). Just simple match for now.
    const arMap = {};
    arRows.forEach(row => {
        const key = `${row.code}-${row.section}`; // Simple composite key
        arMap[key] = row;
    });

    return enRows.map(enRow => {
        const key = `${enRow.code}-${enRow.section}`;
        const arRow = arMap[key];

        return {
            ...enRow,
            name_ar: arRow ? arRow.name : enRow.name, // Fallback to EN name if AR missing
            instructor_ar: arRow ? arRow.instructor : enRow.instructor,
            type: type
        };
    });
}

function consolidateCourses(flatCourses) {
    const coursesMap = {};

    flatCourses.forEach(row => {
        const { code, name, name_ar, section, instructor, instructor_ar, time, room, exam, type } = row;

        if (!coursesMap[code]) {
            coursesMap[code] = {
                id: code,
                code: code,
                name: name,
                name_ar: name_ar || name,
                type: type,
                sectionsMap: {}
            };
        }

        const course = coursesMap[code];

        // Ensure we capture Arabic name if we missed it in first row
        if ((!course.name_ar || course.name_ar === course.name) && name_ar && name_ar !== name) {
            course.name_ar = name_ar;
        }

        // Section consolidation (handling "TBA" appending same as before)
        if (!course.sectionsMap[section]) {
            course.sectionsMap[section] = {
                section,
                instructor,
                instructor_ar: instructor_ar || instructor,
                time,
                room,
                exam
            };
        } else {
            const existing = course.sectionsMap[section];
            if (time && !existing.time.includes(time)) existing.time += ` | ${time}`;
            if (room && !existing.room.includes(room)) existing.room += ` / ${room}`;

            // Merge Instructors (English)
            if (instructor && !isTBA(instructor) && !existing.instructor.includes(instructor)) {
                if (isTBA(existing.instructor)) existing.instructor = instructor;
                else existing.instructor += ` & ${instructor}`;
            }

            // Merge Instructors (Arabic)
            if (instructor_ar && !isTBA(instructor_ar) && !existing.instructor_ar.includes(instructor_ar)) {
                if (isTBA(existing.instructor_ar)) existing.instructor_ar = instructor_ar;
                else existing.instructor_ar += ` & ${instructor_ar}`;
            }
        }
    });

    return Object.values(coursesMap).map(c => ({
        ...c,
        sections: Object.values(c.sectionsMap).sort((a, b) => parseInt(a.section) - parseInt(b.section))
    }));
}

function isTBA(name) {
    if (!name) return true;
    const n = name.toUpperCase();
    return n.includes('TO BE') || n.includes('ANNOUNCED') || n === '';
}

convertData();
