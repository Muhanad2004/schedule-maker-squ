import { useMemo } from 'react';

export default function ExamWarnings({ schedule, t }) {
    const examConflicts = useMemo(() => {
        if (!schedule) return [];

        // Group exams by date
        const examsByDate = {};

        schedule.forEach(section => {
            const examDate = section.exam;
            if (examDate && examDate !== 'TBA') {
                if (!examsByDate[examDate]) {
                    examsByDate[examDate] = [];
                }
                examsByDate[examDate].push(section.code);
            }
        });

        // Find dates with multiple exams
        const conflicts = [];
        Object.entries(examsByDate).forEach(([date, courses]) => {
            if (courses.length >= 2) {
                conflicts.push({ date, courses });
            }
        });

        return conflicts;
    }, [schedule]);

    // Group all exams for display
    const allExams = useMemo(() => {
        if (!schedule) return [];
        return schedule.map((section, idx) => ({
            code: section.code,
            date: section.exam || 'TBA',
            colorIndex: idx
        }));
    }, [schedule]);

    if (!schedule || allExams.length === 0) {
        return null;
    }

    return (
        <div className="exam-warnings-container">
            <div className="exam-warnings-header">
                <h3>📋 {t.examFooter}</h3>
            </div>

            {/* Conflict Warnings */}
            {examConflicts.length > 0 && (
                <div className="exam-conflicts">
                    {examConflicts.map((conflict, idx) => (
                        <div key={idx} className="exam-warning-item">
                            <span className="warning-icon">⚠️</span>
                            <div className="warning-content">
                                <strong>Multiple Exams on {conflict.date}:</strong>
                                <span className="conflict-courses">{conflict.courses.join(', ')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* All Exams List */}
            <div className="exam-list">
                {allExams.map((exam, idx) => (
                    <div key={idx} className="exam-item">
                        <span className="exam-code">{exam.code}</span>
                        <span className="exam-date">{exam.date}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
