import React from 'react';
import MapContainer from './MapContainer';
import ChatWindow from './ChatWindow';


const Sidebar = ({ activeContext, currentMode, onModeChange }) => {



    return (
        <aside className="sidebar">


            <MapContainer />
            <ChatWindow activeContext={activeContext} currentMode={currentMode} />
        </aside>
    );
};

export default Sidebar;
