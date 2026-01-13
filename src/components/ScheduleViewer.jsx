import React, { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { formatTime } from '../utils/timeUtils';
import { jsPDF } from 'jspdf';

const COLORS = [
  { bg: '#60a5fa', border: '#3b82f6' }, // Blue
  { bg: '#34d399', border: '#10b981' }, // Green
  { bg: '#fbbf24', border: '#f59e0b' }, // Amber
  { bg: '#f87171', border: '#ef4444' }, // Red
  { bg: '#a78bfa', border: '#8b5cf6' }, // Purple
  { bg: '#f472b6', border: '#ec4899' }, // Pink
  { bg: '#22d3ee', border: '#06b6d4' }, // Cyan
  { bg: '#a3e635', border: '#84cc16' }, // Lime
];

const formatHour = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return mins > 0 ? `${displayHour}:${mins.toString().padStart(2, '0')} ${period}` : `${displayHour}:00 ${period}`;
};

export default function ScheduleViewer({
  schedule,
  allSchedules,
  scheduleIndex,
  totalSchedules,
  onNext,
  onPrev,
  t
}) {
  const { language } = useLanguage();
  const scheduleRef = useRef(null);
  const [examsExpanded, setExamsExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [overrideSchedule, setOverrideSchedule] = useState(null);

  // Use the override schedule during batch export, otherwise proper prop
  const displaySchedule = overrideSchedule || schedule;

  const captureScheduleToPDF = async (doc, isFirstPage) => {
    if (!scheduleRef.current) return;

    const html2canvas = (await import('html2canvas')).default;

    // A5 Landscape dimensions in mm (210 x 148)
    const PAGE_WIDTH = 210;
    const PAGE_HEIGHT = 148;
    const MARGIN = 10;

    // Capture at ultra-high scale for sharpness (3x ~ 300 DPI)
    const div = scheduleRef.current;
    const canvas = await html2canvas(div, {
      scale: 3,
      backgroundColor: getComputedStyle(div).backgroundColor || '#ffffff',
      useCORS: true
    });

    // Use JPEG with 0.72 quality - High Res + Medium Compression = Crisp text, low file size
    const imgData = canvas.toDataURL('image/jpeg', 0.72);
    const imgProps = doc.getImageProperties(imgData);

    // Calculate fit (Fill Page Width or Height)
    const availWidth = PAGE_WIDTH - (MARGIN * 2);
    const availHeight = PAGE_HEIGHT - (MARGIN * 2);

    const ratioX = availWidth / imgProps.width;
    const ratioY = availHeight / imgProps.height;
    const ratio = Math.min(ratioX, ratioY);

    const pdfWidth = imgProps.width * ratio;
    const pdfHeight = imgProps.height * ratio;

    // Center content
    const x = (PAGE_WIDTH - pdfWidth) / 2;
    const y = (PAGE_HEIGHT - pdfHeight) / 2;

    if (!isFirstPage) doc.addPage();

    doc.addImage(imgData, 'JPEG', x, y, pdfWidth, pdfHeight);
  };

  /* Shared Wait Helper */
  const waitForRender = () => new Promise(resolve => {
    // Double RAF ensures paint has occurred
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });

  const handleExportSingle = async () => {
    setIsExporting(true);
    // Wait for re-render so .exporting class applies and header shows
    await waitForRender();

    try {
      const doc = new jsPDF('l', 'mm', 'a5');
      await captureScheduleToPDF(doc, true);
      doc.save(`Schedule_${scheduleIndex + 1}.pdf`);
    } catch (err) {
      console.error("Export failed", err);
    }
    setIsExporting(false);
  };

  const handleExportAll = async () => {
    if (!allSchedules || allSchedules.length === 0) return;

    setIsExporting(true);
    setExportProgress(1);

    try {
      const doc = new jsPDF('l', 'mm', 'a5');

      for (let i = 0; i < allSchedules.length; i++) {
        setExportProgress(i + 1);
        setOverrideSchedule(allSchedules[i]);
        await waitForRender();
        await captureScheduleToPDF(doc, i === 0);
      }

      doc.save('All_Schedules.pdf');
    } catch (err) {
      console.error("Batch export failed", err);
    }

    setOverrideSchedule(null);
    setIsExporting(false);
  };

  // Calculate unique time slots from all classes - sorted by start time, then duration (shorter first)
  const timeSlots = useMemo(() => {
    if (!displaySchedule) return [];

    const slots = new Set();

    displaySchedule.forEach(section => {
      const parsedSlots = section.parsedSlots || [];
      parsedSlots.forEach(slot => {
        slots.add(`${slot.start}-${slot.end}`);
      });
    });

    const slotArray = Array.from(slots).map(slotStr => {
      const [start, end] = slotStr.split('-').map(Number);
      return { start, end, key: slotStr, duration: end - start };
    });

    // Sort by start time, then by duration (shorter first)
    slotArray.sort((a, b) => {
      if (a.start === b.start) {
        return a.duration - b.duration;
      }
      return a.start - b.start;
    });

    return slotArray;
  }, [displaySchedule]);

  // Organize classes by day and time slot
  const gridData = useMemo(() => {
    if (!displaySchedule) return {};

    const data = {};

    displaySchedule.forEach((section, sectionIdx) => {
      const parsedSlots = section.parsedSlots || [];
      parsedSlots.forEach(slot => {
        const slotKey = `${slot.start}-${slot.end}`;
        const day = slot.day;

        if (!data[slotKey]) {
          data[slotKey] = {};
        }
        if (!data[slotKey][day]) {
          data[slotKey][day] = [];
        }

        data[slotKey][day].push({
          ...section,
          ...slot,
          colorIndex: sectionIdx
        });
      });
    });

    return data;
  }, [displaySchedule]);

  // Detect exam conflicts (2+ exams on same day)
  const examConflicts = useMemo(() => {
    if (!displaySchedule) return { count: 0, dates: [] };

    const examsByDate = {};
    displaySchedule.forEach(section => {
      const examFull = section.exam;
      if (examFull && examFull !== 'TBA') {
        // Extract date part (e.g., "21/05/2026 THU")
        const dateMatch = examFull.match(/^(\d{2}\/\d{2}\/\d{4}\s+\w+)/);
        const datePart = dateMatch ? dateMatch[1] : examFull;

        // Extract time part (e.g., "08:00:00 - 11:00:00")
        const timeMatch = examFull.match(/(\d{2}:\d{2}:\d{2}\s*-\s*\d{2}:\d{2}:\d{2})/);
        const timePart = timeMatch ? timeMatch[1] : '';

        if (!examsByDate[datePart]) {
          examsByDate[datePart] = [];
        }
        examsByDate[datePart].push({
          code: section.code,
          time: timePart
        });
      }
    });

    const conflictDates = [];
    Object.entries(examsByDate).forEach(([date, exams]) => {
      if (exams.length >= 2) {
        conflictDates.push({ date, exams });
      }
    });

    return { count: conflictDates.length, dates: conflictDates };
  }, [displaySchedule]);

  const days = t.days;

  if (!displaySchedule) {
    return (
      <div className="schedule-viewer">
        <div className="schedule-empty">
          <span className="empty-icon">
            <img src="https://emojicdn.elk.sh/📅?style=apple" alt="Schedule" style={{ width: '48px', height: '48px' }} />
          </span>
          <h3>{t.schedule}</h3>
          <p>{t.noSchedules}</p>
        </div>
      </div>
    );
  }

  const isRtl = document.body.classList.contains('rtl');
  const prevIcon = isRtl ? '→' : '←';
  const nextIcon = isRtl ? '←' : '→';

  return (
    <div className="schedule-viewer">
      {/* Overlay for Exporting */}
      {isExporting && (
        <div className="export-overlay">
          <div className="export-spinner"></div>
          <h3>{t.exporting}</h3>
          {overrideSchedule && <p>{exportProgress} / {allSchedules.length}</p>}
        </div>
      )}

      {/* Header */}
      <div className="schedule-header">
        <h2>
          {t.schedule} {(overrideSchedule ? exportProgress : scheduleIndex + 1)}
          <span className="text-dim"> {t.of} {totalSchedules}</span>
        </h2>
        <div className="schedule-controls">
          <div className="nav-controls">
            <button className="nav-btn" onClick={onPrev} disabled={scheduleIndex === 0}>{prevIcon}</button>
            <span className="schedule-counter">{scheduleIndex + 1} / {totalSchedules}</span>
            <button className="nav-btn" onClick={onNext} disabled={scheduleIndex === totalSchedules - 1}>{nextIcon}</button>
          </div>

          <div className="export-actions" style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-secondary" onClick={handleExportSingle} title={t.exportSchedule} disabled={isExporting}>
              📄 {t.exportSchedule}
            </button>
            <button className="btn-secondary" onClick={handleExportAll} title={t.exportAll} disabled={isExporting}>
              📚 {t.exportAll}
            </button>
          </div>
        </div>
      </div>

      {/* Grid Schedule */}
      <div className="schedule-calendar">
        <div ref={scheduleRef} className={`schedule-print-wrapper ${isExporting ? 'exporting' : ''}`}>
          <div className="print-header">
            <div className="print-header-left">Schedule #{overrideSchedule ? exportProgress : scheduleIndex + 1}</div>
            <div className="print-header-right">جدول رقم {overrideSchedule ? exportProgress : scheduleIndex + 1}</div>
          </div>

          <div className="schedule-grid">
            {/* Header Row */}
            <div className="grid-header time-header">{t.timeDay}</div>
            {days.map((day, idx) => (
              <div key={idx} className="grid-header">{day}</div>
            ))}

            {/* Time Slot Rows */}
            {timeSlots.map(slot => {
              const slotKey = slot.key;
              const slotData = gridData[slotKey] || {};

              return (
                <React.Fragment key={slotKey}>
                  {/* Time Cell */}
                  <div className="time-cell">
                    {formatHour(slot.start)} - {formatHour(slot.end)}
                  </div>

                  {/* Day Cells */}
                  {[0, 1, 2, 3, 4].map(dayIdx => {
                    const classes = slotData[dayIdx] || [];

                    return (
                      <div key={dayIdx} className={`day-cell ${classes.length > 0 ? 'has-class' : ''}`}>
                        {classes.map((cls, clsIdx) => {
                          const color = COLORS[cls.colorIndex % COLORS.length];
                          // Room label: DLR for distance learning, actual room, or NA
                          const roomLabel = cls.room === 'DLR'
                            ? 'DLR'
                            : (cls.room && cls.room.trim() ? cls.room : 'NA');

                          return (
                            <div
                              key={clsIdx}
                              className="class-block"
                              style={{
                                backgroundColor: color.bg,
                                borderLeftColor: color.border
                              }}
                              title={`${cls.code} - ${cls.instructor} | ${roomLabel}`}
                            >
                              <div className="block-code">{cls.code}/{cls.section}</div>
                              <div className="block-time" style={{ direction: 'ltr' }}>
                                {formatTime(cls.start)} - {formatTime(cls.end)} | {roomLabel}
                              </div>
                              <div className="block-instructor">{cls.instructor}</div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Exam Footer - Dropdown */}
      <div className="schedule-footer">
        <div className="footer-toggle" onClick={() => setExamsExpanded(!examsExpanded)}>
          <div className="footer-group">
            <span>
              <img src="https://emojicdn.elk.sh/📋?style=apple" alt="Exam" className="emoji-icon" style={{ marginRight: '0.4rem', marginLeft: '0.4rem' }} />
              {t.examFooter}
            </span>
            {examConflicts.count > 0 && (
              <span className="conflict-pill">
                {t.conflict}
              </span>
            )}
          </div>
          <span>{examsExpanded ? '▲' : '▼'}</span>
        </div>

        {examsExpanded && (
          <div className="exam-details-container">
            {/* Conflict warnings */}
            {examConflicts.dates.length > 0 && (
              <div className="exam-conflicts-section">
                {examConflicts.dates.map((conflict, idx) => (
                  <div key={idx} className="exam-conflict-warning">
                    <div className="conflict-header">
                      <img src="https://emojicdn.elk.sh/⚠️?style=apple" alt="Warning" className="emoji-icon" />
                      {t.multipleExamsOn} {conflict.date}:
                    </div>
                    <div className="conflict-courses">
                      {conflict.exams.map((exam, examIdx) => (
                        <div key={examIdx} className="conflict-course-item">
                          {exam.code} → {exam.time}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="exam-divider"></div>
              </div>
            )}

            {/* All exams */}
            <div className="exam-list">
              {schedule.map((section, idx) => (
                <div
                  key={idx}
                  className="exam-item"
                  style={{ borderLeftColor: COLORS[idx % COLORS.length].bg }}
                >
                  <span className="exam-code">{section.code}</span>
                  <span className="exam-date">{section.exam || 'TBA'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
