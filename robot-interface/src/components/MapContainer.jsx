import React, { useMemo, useEffect } from 'react';
import { Box } from '@mui/material';
import { MapContainer as LeafletMapContainer, TileLayer, CircleMarker, Popup, useMap, ZoomControl } from 'react-leaflet';

const defaultPosition = [6.383, 80.408];

const FlyToLocation = ({ position }) => {
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.flyTo(position, 15, { duration: 1.2 });
        }
    }, [map, position]);

    return null;
};

const parseCoordinates = (telemetry) => {
    if (!telemetry) return null;

    const gps = telemetry.gps ?? telemetry;
    const lat = gps.latitude ?? gps.lat ?? gps.gps?.latitude ?? gps.gps?.lat ?? gps.location?.latitude ?? gps.location?.lat;
    const lon = gps.longitude ?? gps.lon ?? gps.lng ?? gps.gps?.longitude ?? gps.gps?.lon ?? gps.location?.longitude ?? gps.location?.lon;

    const parsedLat = typeof lat === 'string' ? Number(lat) : lat;
    const parsedLon = typeof lon === 'string' ? Number(lon) : lon;

    if (Number.isFinite(parsedLat) && Number.isFinite(parsedLon)) {
        return [parsedLat, parsedLon];
    }

    return null;
};

const MapContainer = ({ theme, telemetry }) => {
    const position = useMemo(() => parseCoordinates(telemetry), [telemetry]);
    const center = position || defaultPosition;
    const label = position
        ? `LAT: ${center[0].toFixed(5)} | LON: ${center[1].toFixed(5)}`
        : 'Waiting for GPS coordinates...';

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                minHeight: 220,
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: theme === 'dark' ? '#08100a' : '#eef4ec',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Box sx={{ flex: '1 1 0', minHeight: 0, height: '100%' }}>
                <LeafletMapContainer
                    center={center}
                    zoom={position ? 15 : 5}
                    scrollWheelZoom={true}
                    zoomControl={false}
                    style={{ width: '100%', height: '100%', minHeight: 280 }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ZoomControl position="topright" />
                    {position && (
                        <>
                            <FlyToLocation position={center} />
                            <CircleMarker
                                center={center}
                                radius={8}
                                pathOptions={{ color: '#00ff88', fillColor: '#00ff88', fillOpacity: 0.9 }}
                            >
                                <Popup>Robot location</Popup>
                            </CircleMarker>
                        </>
                    )}
                </LeafletMapContainer>
            </Box>

            <Box
                sx={{
                    px: 1.25,
                    py: 1,
                    fontSize: 12,
                    color: theme === 'dark' ? '#f7fff7' : '#0b2b15',
                    bgcolor: theme === 'dark' ? 'rgba(0, 0, 0, 0.62)' : 'rgba(255, 255, 255, 0.95)',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                }}
            >
                {position
                    ? `Robot location: LAT ${center[0].toFixed(5)}, LON ${center[1].toFixed(5)}`
                    : 'Waiting for GPS coordinates...'}
            </Box>
        </Box>
    );
};

export default MapContainer;
