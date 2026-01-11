import React, { useMemo } from 'react';

const DataSourceBadge = ({ sourceDate = '2026-01-11' }) => {
    const daysAgo = useMemo(() => {
        const source = new Date(sourceDate);
        const today = new Date();
        const diffTime = Math.abs(today - source);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }, [sourceDate]);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getRecencyColor = () => {
        if (daysAgo === 0) return 'var(--success)';
        if (daysAgo <= 7) return 'var(--primary)';
        if (daysAgo <= 30) return 'var(--warning)';
        return 'var(--error)';
    };

    const getRecencyText = () => {
        if (daysAgo === 0) return 'Today';
        if (daysAgo === 1) return 'Yesterday';
        return `${daysAgo} days ago`;
    };

    return (
        <div className="data-source-badge">
            <span className="badge-icon">📊</span>
            <div className="badge-content">
                <span className="badge-label">Data from:</span>
                <span className="badge-date">{formatDate(sourceDate)}</span>
            </div>
            <div
                className="badge-recency"
                style={{
                    background: getRecencyColor(),
                    color: 'white'
                }}
            >
                {getRecencyText()}
            </div>
        </div>
    );
};

export default DataSourceBadge;
