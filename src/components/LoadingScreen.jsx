import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ message = "Loading courses..." }) => {
    return (
        <div className="loading-screen">
            <div className="loading-content">
                <div className="loading-icon">
                    <div className="calendar-icon">
                        <div className="calendar-header"></div>
                        <div className="calendar-grid">
                            <div className="calendar-dot"></div>
                            <div className="calendar-dot"></div>
                            <div className="calendar-dot"></div>
                            <div className="calendar-dot"></div>
                        </div>
                    </div>
                </div>
                <h2 className="loading-title">Schedule Maker</h2>
                <p className="loading-message">{message}</p>
                <div className="loading-bar">
                    <div className="loading-progress"></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
