export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Format minutes to "8:00 AM"
export const formatTime = (minutes) => {
  if (minutes === null || minutes === undefined) return '';
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  const h12 = h % 12 || 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
};

// Parse time string into slots
// Input: "SUN 8:00-9:00 | TUE 8:00-9:00"
export const parseTimeSlots = (timeString) => {
  if (!timeString) return [];
  const slots = [];
  const parts = timeString.split('|');
  const daysMap = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  // Regex: 8:00 or 08:00, optional :00 seconds, - 9:00...
  const timeRegex = /(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(\d{1,2}:\d{2}(?::\d{2})?)/;
  
  parts.forEach(part => {
    const lower = part.toLowerCase();
    const timeMatch = lower.match(timeRegex);
    if (timeMatch) {
      const [sh, sm] = timeMatch[1].split(':').map(Number);
      const [eh, em] = timeMatch[2].split(':').map(Number);
      const start = sh * 60 + sm;
      const end = eh * 60 + em;
      
      const nonTimePart = lower.replace(timeRegex, '');
      const tokens = nonTimePart.split(/[^a-z]+/).filter(Boolean);
      tokens.forEach(token => {
        if (daysMap[token] !== undefined) {
          slots.push({ day: daysMap[token], start, end });
        }
      });
    }
  });
  return slots;
};

// Summarize slots for display: "Sun/Tue 8:00 AM - 9:20 AM"
export const getInstructorScheduleSummary = (sections) => {
    // Gather all unique time slots
    const allSlots = sections.flatMap(s => parseTimeSlots(s.time));
    if (allSlots.length === 0) return 'TBA';

    // Group by time range (start-end)
    const byTime = {};
    allSlots.forEach(slot => {
        const key = `${slot.start}-${slot.end}`;
        if (!byTime[key]) byTime[key] = { start: slot.start, end: slot.end, days: new Set() };
        byTime[key].days.add(slot.day);
    });

    return Object.values(byTime).map(group => {
        const sortedDays = [...group.days].sort().map(d => DAYS[d]);
        return `${sortedDays.join('/')} ${formatTime(group.start)} - ${formatTime(group.end)}`;
    }).join(', ');
};
