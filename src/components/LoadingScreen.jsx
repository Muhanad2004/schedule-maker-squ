import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ message = "Opening course catalog..." }) => {
    return (
        <div className="loading-screen">
            <div className="loading-content">
                <div className="book-loader">
                    <div className="book-page"></div>
                    <div className="book-page"></div>
                    <div className="book-page"></div>
                </div>
                <h2 className="loading-title">Schedule Maker</h2>
                <p className="loading-message">{message}</p>
            </div>
        </div>
    );
};

export default LoadingScreen;
