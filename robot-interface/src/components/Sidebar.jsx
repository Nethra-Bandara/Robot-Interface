import React from 'react';
import MapContainer from './MapContainer';
import ChatWindow from './ChatWindow';


const Sidebar = ({ activeContext, currentMode, onModeChange, theme, telemetry }) => {



    return (
        <aside className="sidebar">
            {/* Display Telemetry Data */}
            <div className="telemetry-panel" style={{ padding: '15px', background: 'rgba(0,0,0,0.1)', marginBottom: '15px', borderRadius: '8px' }}>
                <h3>🤖 Robot Status</h3>
                {telemetry ? (
                    <ul>
                        <li>Battery: {telemetry.battery || 'N/A'}%</li>
                        <li>Speed: {telemetry.speed || '0'} m/s</li>
                        <li>Status: {telemetry.status || 'Active'}</li>
                    </ul>
                ) : (
                    <p>Waiting for telemetry data...</p>
                )}
            </div>

            <MapContainer theme={theme} />
            <ChatWindow activeContext={activeContext} currentMode={currentMode} theme={theme} />
        </aside>
    );
};

export default Sidebar;
