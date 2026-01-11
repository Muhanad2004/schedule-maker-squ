import fs from 'fs';
import path from 'path';
import * as XLSX_Module from 'xlsx';
import { fileURLToPath } from 'url';

// Handle ESM/CommonJS interop for XLSX
const XLSX = XLSX_Module.default || XLSX_Module;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAW_DATA_DIR = path.join(__dirname, '../raw-data');
const OUTPUT_FILE = path.join(__dirname, '../src/data/courses.json');

function convertData() {
    if (!fs.existsSync(RAW_DATA_DIR)) {
        console.error(`Directory not found: ${RAW_DATA_DIR}`);
        process.exit(1);
    }

    const files = fs.readdirSync(RAW_DATA_DIR).filter(file => file.endsWith('.xls') || file.endsWith('.xlsx'));
    
    if (files.length === 0) {
        console.warn('No Excel files found in raw-data directory.');
        return;
    }

    let allCourses = [];

    files.forEach(file => {
        console.log(`Processing ${file}...`);
        const workbook = XLSX.readFile(path.join(RAW_DATA_DIR, file));
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // Read as array of arrays to find the header row
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rows.length === 0) return;

        // Find header row index
        let headerRowIndex = -1;
        let columnIndices = {};

        for (let i = 0; i < Math.min(rows.length, 20); i++) {
            const rowStr = rows[i].map(c => String(c).toLowerCase()).join(' ');
            if (rowStr.includes('course') && (rowStr.includes('code') || rowStr.includes('title'))) {
                headerRowIndex = i;
                console.log(`Actual Header Row [${i}]:`, rows[i]);
                // Map columns
                rows[i].forEach((cell, idx) => {
                    const val = String(cell).toLowerCase().trim();
                    if (val === 'course code') columnIndices.code = idx;
                    else if (val === 'course name') columnIndices.name = idx;
                    else if (val === 'section num') columnIndices.section = idx;
                    else if (val === 'instructor') columnIndices.instructor = idx;
                    else if (val === 'day') columnIndices.day = idx;
                    else if (val === 'from time') columnIndices.from = idx;
                    else if (val === 'to time') columnIndices.to = idx;
                    else if (val === 'hall') columnIndices.room = idx;
                    else if (val.includes('exam date')) columnIndices.exam = idx;
                });
                console.log(`Found headers at row ${i} in ${file}:`, columnIndices);
                break;
            }
        }

        if (headerRowIndex === -1) {
            console.warn(`Could not find header row in ${file}. Skipping.`);
            return;
        }

        // Process data rows
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const code = row[columnIndices.code];
            // Skip empty rows or rows that repeat headers
            if (!code || String(code).toLowerCase().includes('course code')) continue;

            const day = String(row[columnIndices.day] || '').trim();
            const from = String(row[columnIndices.from] || '').trim();
            const to = String(row[columnIndices.to] || '').trim();
            
            // Combine into unified time string e.g. "Sun 08:00-09:00"
            // Note: Data might be "U R" or "Sun Tue" or "U" etc.
            // We just concat them for now, assuming scheduler parses correctly.
            const timeStr = (day && from && to) ? `${day} ${from}-${to}` : '';

            allCourses.push({
                code: String(row[columnIndices.code] || '').trim(),
                name: String(row[columnIndices.name] || '').trim(),
                section: String(row[columnIndices.section] || '').trim(),
                instructor: String(row[columnIndices.instructor] || '').trim(),
                time: timeStr,
                room: String(row[columnIndices.room] || '').trim(),
                exam: String(row[columnIndices.exam] || '').trim()
            });
        }
    });

    const processedData = processCourses(allCourses);

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(processedData, null, 2));
    console.log(`Data converted successfully! Saved to ${OUTPUT_FILE}`);
}

function processCourses(flatData) {
    const coursesMap = {};

    flatData.forEach(row => {
        const { code, name, section, instructor, time, room, exam } = row;
        
        if (!coursesMap[code]) {
            coursesMap[code] = {
                id: code,
                code: code,
                name: name || code,
                sectionsMap: {} // Temporary map to merge sections
            };
        }

        const course = coursesMap[code];
        
        // If section already exists, append time.
        // Assuming instructor/room might be same or different, we can append or ignore.
        // For SQU, usually same instructor, maybe different room.
        
        if (!course.sectionsMap[section]) {
            course.sectionsMap[section] = {
                section,
                instructor,
                time, // Start with this time
                room,
                exam
            };
        } else {
            // Merge logic
            const existing = course.sectionsMap[section];
            // Append time if different
            if (time && !existing.time.includes(time)) {
                existing.time += ` | ${time}`;
            }
            // Append room if different
            if (room && !existing.room.includes(room)) {
                existing.room += ` / ${room}`;
            }
            // Append instructor if different and meaningful
            if (instructor && instructor.toUpperCase() !== 'TO BE ANNOUNCED' && !existing.instructor.includes(instructor)) {
                if (existing.instructor.toUpperCase().includes('TO BE ANNOUNCED') || existing.instructor === '') {
                    existing.instructor = instructor;
                } else {
                     // Check if it's already a substring to avoid "Smith & Smith"
                     if (!existing.instructor.includes(instructor)) {
                         existing.instructor += ` & ${instructor}`;
                     }
                }
            }
        }
    });

    // Convert map to array
    return Object.values(coursesMap).map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        sections: Object.values(c.sectionsMap)
    }));
}

// Remove the automatic call, make it exportable or wrapped if needed, 
// but since we run it as a script, keep the call.
convertData();
