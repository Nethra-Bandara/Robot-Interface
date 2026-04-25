import React from 'react';

const MapContainer = ({ theme }) => {
    return (
        <div className="map-container">
            <img
                src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Google_Maps_icon_%282020%29.svg"
                className="map-img"
                style={{ objectFit: 'contain', padding: '20px' }}
                alt="GPS Map"
            />
            <div className="gps-marker"></div>
            <div style={{ 
                position: 'absolute', 
                bottom: '5px', 
                left: '5px', 
                fontSize: '10px', 
                background: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.6)',
                color: '#fff',
                padding: '2px 5px',
                borderRadius: '4px'
            }}>
                LAT: 6.38°N | LON: 80.41°E
            </div>
        </div>
    );
};

export default MapContainer;
