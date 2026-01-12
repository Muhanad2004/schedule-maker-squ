import React, { useMemo, useRef, useCallback, useState } from 'react';
import { formatTime } from '../utils/timeUtils';

const COLORS = [
  { bg: '#3b82f6', border: '#2563eb' },
  { bg: '#10b981', border: '#059669' },
  { bg: '#f59e0b', border: '#d97706' },
  { bg: '#ef4444', border: '#dc2626' },
  { bg: '#8b5cf6', border: '#7c3aed' },
  { bg: '#ec4899', border: '#db2777' },
  { bg: '#06b6d4', border: '#0891b2' },
  { bg: '#84cc16', border: '#65a30d' },
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
  scheduleIndex,
  totalSchedules,
  onNext,
  onPrev,
  t
}) {
  const scheduleRef = useRef(null);

  const handleDownload = useCallback(async () => {
    if (!scheduleRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;

      // A4 landscape dimensions at 96 DPI: 1123 x 794 pixels
      const A4_LANDSCAPE_WIDTH = 1123;
      const A4_LANDSCAPE_HEIGHT = 794;

      // Get the current element dimensions
      const elementWidth = scheduleRef.current.offsetWidth;
      const elementHeight = scheduleRef.current.offsetHeight;

      // Calculate scale to fit A4 landscape while maintaining aspect ratio
      const scaleX = A4_LANDSCAPE_WIDTH / elementWidth;
      const scaleY = A4_LANDSCAPE_HEIGHT / elementHeight;
      const scale = Math.min(scaleX, scaleY);

      // Get computed background color from theme
      const computedStyle = getComputedStyle(scheduleRef.current);
      const bgColor = computedStyle.backgroundColor || '#ffffff';

      const canvas = await html2canvas(scheduleRef.current, {
        backgroundColor: bgColor,
        scale: scale,
        width: elementWidth,
        height: elementHeight
      });

      // Create final A4 canvas and center the schedule
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = A4_LANDSCAPE_WIDTH;
      finalCanvas.height = A4_LANDSCAPE_HEIGHT;
      const ctx = finalCanvas.getContext('2d');

      // Fill background with theme color
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, A4_LANDSCAPE_WIDTH, A4_LANDSCAPE_HEIGHT);

      // Center the scaled schedule on the canvas
      const offsetX = (A4_LANDSCAPE_WIDTH - canvas.width) / 2;
      const offsetY = (A4_LANDSCAPE_HEIGHT - canvas.height) / 2;
      ctx.drawImage(canvas, offsetX, offsetY);

      const link = document.createElement('a');
      link.download = `schedule-${scheduleIndex + 1}.png`;
      link.href = finalCanvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [scheduleIndex]);

  // Calculate unique time slots from all classes
  const timeSlots = useMemo(() => {
    if (!schedule) return [];

    const slots = new Set();

    schedule.forEach(section => {
      const parsedSlots = section.parsedSlots || [];
      parsedSlots.forEach(slot => {
        // Add time slot as "start-end" string
        slots.add(`${slot.start}-${slot.end}`);
      });
    });

    // Convert to array and sort
    const slotArray = Array.from(slots).map(slotStr => {
      const [start, end] = slotStr.split('-').map(Number);
      return { start, end, key: slotStr };
    });

    slotArray.sort((a, b) => a.start - b.start);
    return slotArray;
  }, [schedule]);

  // Organize classes by day and time slot
  const gridData = useMemo(() => {
    if (!schedule) return {};

    const data = {};

    schedule.forEach((section, sectionIdx) => {
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
  }, [schedule]);

  const days = useMemo(() => {
    const isRtl = document.body.classList.contains('rtl');
    return isRtl ? t.days.slice().reverse() : t.days;
  }, [t.days]);

  if (!schedule) {
    return (
      <div className="schedule-viewer">
        <div className="schedule-empty">
          <span className="empty-icon">📅</span>
          <h3>{t.schedule}</h3>
          <p>{t.noSchedules}</p>
        </div>
      </div>
    );
  }

  // Determine direction for arrows
  const isRtl = document.body.classList.contains('rtl');
  const prevIcon = isRtl ? '→' : '←';
  const nextIcon = isRtl ? '←' : '→';

  return (
    <div className="schedule-viewer">
      {/* Header */}
      <div className="schedule-header">
        <h2>
          {t.schedule} {scheduleIndex + 1}
          <span className="text-dim"> {t.of} {totalSchedules}</span>
        </h2>
        <div className="schedule-controls">
          <button className="nav-btn" onClick={onPrev} disabled={scheduleIndex === 0}>{prevIcon}</button>
          <span className="schedule-counter">{scheduleIndex + 1} / {totalSchedules}</span>
          <button className="nav-btn" onClick={onNext} disabled={scheduleIndex === totalSchedules - 1}>{nextIcon}</button>
          <button className="icon-btn" onClick={handleDownload} title={t.saveImage}>📷</button>
        </div>
      </div>

      {/* Grid Schedule */}
      <div className="schedule-calendar">
        <div ref={scheduleRef} className="schedule-grid">
          {/* Header Row */}
          <div className="grid-header time-header">{t.days ? 'Time/Day' : 'Time/Day'}</div>
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
                  const actualDayIdx = isRtl ? 4 - dayIdx : dayIdx;
                  const classes = slotData[actualDayIdx] || [];

                  return (
                    <div key={dayIdx} className="day-cell">
                      {classes.map((cls, clsIdx) => {
                        const color = COLORS[cls.colorIndex % COLORS.length];
                        return (
                          <div
                            key={clsIdx}
                            className="class-block"
                            style={{
                              backgroundColor: color.bg,
                              borderLeftColor: color.border
                            }}
                            title={`${cls.code} - ${cls.instructor}`}
                          >
                            <div className="block-code">{cls.code}/{cls.section}</div>
                            <div className="block-time">
                              {formatTime(cls.start)} - {formatTime(cls.end)}
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
  );
}
