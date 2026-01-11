import './LoadingScreen.css';

export default function LoadingScreen({ message = 'Loading...' }) {
    return (
        <div className="loading-screen">
            <div className="loading-content">
                <div className="book-animation">
                    <div className="book">
                        <div className="book-cover"></div>
                        <div className="book-page"></div>
                        <div className="book-page"></div>
                        <div className="book-page"></div>
                    </div>
                </div>
                <h1 className="loading-title">Schedule Maker</h1>
                <p className="loading-message">{message}</p>
            </div>
        </div>
    );
}
