export default function DataSourceBadge({ sourceDate }) {
    return (
        <div className="data-badge">
            <span className="badge-icon">📊</span>
            <span className="badge-text">Data: {sourceDate}</span>
        </div>
    );
}
