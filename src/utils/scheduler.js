/**
 * Checks if two time ranges overlap.
 * @param {Object} t1 - { day, start, end } (start/end in minutes or comparable value)
 * @param {Object} t2 
 */
function isOverlapping(t1, t2) {
    if (t1.day !== t2.day) return false;
    // Assuming 24h format converted to minutes or similar, or string comparison if standard ISO
    // Let's assume input comes as "HH:MM" strings. We need to parse them.
    // Actually, let's helper function to parse time first.
    
    // Simplification: We will assume the passed Objects already have parsed start/end in minutes.
    return Math.max(t1.start, t2.start) < Math.min(t1.end, t2.end);
}

/**
 * Parses a time string "HH:MM" to minutes from midnight.
 */
function parseTime(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

/**
 * Parses time slots typically found in university data.
 * Format examples: "Sun 10:00-11:50", "Mon,Wed 14:00-15:15"
 * This function needs to be robust.
 */
function parseTimeSlots(timeString) {
    if (!timeString) return [];
    
    // timeString might be "SUN 12:00-13:00 | TUE 12:00-13:00"
    
    const slots = [];
    
    // Split by the delimiter we added in convert-data
    const parts = timeString.split('|');

    const daysMap = {
        'sun': 0, 'u': 0, 'sunday': 0,
        'mon': 1, 'm': 1, 'monday': 1,
        'tue': 2, 't': 2, 'tuesday': 2,
        'wed': 3, 'w': 3, 'wednesday': 3,
        'thu': 4, 'r': 4, 'thursday': 4,
        'fri': 5, 'f': 5, 'friday': 5,
        'sat': 6, 's': 6, 'saturday': 6
    };
    
    // Regex for time range
    const timeRegex = /(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(\d{1,2}:\d{2}(?::\d{2})?)/;

    parts.forEach(part => {
        const lower = part.toLowerCase();
        const timeMatch = lower.match(timeRegex);
        
        if (timeMatch) {
            const start = parseTime(timeMatch[1]);
            const end = parseTime(timeMatch[2]);
            
            // Extract days from this specific part
            const nonTimePart = lower.replace(timeRegex, '');
            const tokens = nonTimePart.split(/[^a-z]+/).filter(Boolean);

            tokens.forEach(token => {
                if (daysMap.hasOwnProperty(token)) {
                    slots.push({ day: daysMap[token], start, end });
                }
            });
        }
    });

    return slots;
}

/**
 * Checks if a section conflicts with an existing schedule.
 * @param {Object} section 
 * @param {Array} currentSchedule 
 */
function hasConflict(section, currentSchedule) {
    // section.time is the raw string, we need to parse it or have it pre-parsed.
    // For performance, pre-parsing in dataLoader or convert-data is better.
    // But let's do it on fly or assume pre-parsed 'parsedSlots'.
    
    const newSlots = section.parsedSlots || parseTimeSlots(section.time || "");

    for (const scheduledSection of currentSchedule) {
        const existingSlots = scheduledSection.parsedSlots || parseTimeSlots(scheduledSection.time || "");
        
        for (const s1 of newSlots) {
            for (const s2 of existingSlots) {
                if (isOverlapping(s1, s2)) return true;
            }
        }
    }
    return false;
}

/**
 * Generates all possible schedules using backtracking.
 * @param {Array} selectedCourses - Array of Course objects, each containing .sections
 * @returns {Array} Array of schedules (each schedule is an array of Sections)
 */
export function generateSchedules(selectedCourses) {
    const results = [];
    
    // Optimization: Sort courses by number of sections (fewest options first)
    const sortedCourses = [...selectedCourses].sort((a, b) => a.sections.length - b.sections.length);

    function backtrack(courseIndex, currentSchedule) {
        if (courseIndex === sortedCourses.length) {
            results.push([...currentSchedule]);
            return;
        }

        const course = sortedCourses[courseIndex];
        
        for (const section of course.sections) {
            // Lazy parsing if not already done
            if (!section.parsedSlots) {
                section.parsedSlots = parseTimeSlots(section.time || "");
            }

            if (!hasConflict(section, currentSchedule)) {
                // Enrich section with course info so UI can display it
                // We create a new object to avoid mutating the original data endlessly if we rerun 
                const enrichedSection = { 
                    ...section, 
                    code: course.code, 
                    name: course.name 
                };
                currentSchedule.push(enrichedSection);
                backtrack(courseIndex + 1, currentSchedule);
                currentSchedule.pop();
            }
        }
    }

    backtrack(0, []);
    return results;
}
