import React from 'react';
import MapContainer from './MapContainer';
import ChatWindow from './ChatWindow';


const Sidebar = ({ activeContext, currentMode, onModeChange, theme, telemetry }) => {



    return (
        <aside className="sidebar">


            <MapContainer theme={theme} />
            <ChatWindow activeContext={activeContext} currentMode={currentMode} theme={theme} />
        </aside>
    );
};

export default Sidebar;
