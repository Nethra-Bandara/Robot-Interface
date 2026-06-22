import { useState, useEffect } from 'react';
import mqtt from 'mqtt';

const MQTT_URL =
    'wss://002277b56cde45b29a96d3dd3ef81785.s1.eu.hivemq.cloud:8884/mqtt';

const TELEMETRY_TOPIC = import.meta.env.VITE_TELEMETRY_TOPIC || 'robot/telemetry';

const options = {
    username: 'robot_interface',
    password: 'Pwd12345',
};

export const useMQTT = () => {

    const [client, setClient] = useState(null);
    const [telemetry, setTelemetry] = useState(null);
    const [mqttConnected, setMqttConnected] = useState(false);

    useEffect(() => {

        const mqttClient = mqtt.connect(MQTT_URL, options);

        setClient(mqttClient);

        mqttClient.on('connect', () => {
            setMqttConnected(true);
            console.log('Connected to MQTT Broker');

            const GPS_TOPIC = import.meta.env.VITE_GPS_TOPIC || 'gps';
            mqttClient.subscribe(GPS_TOPIC, (err) => {
                    if (err) {
                        console.error('Subscribe error:', err);
                    } else {
                        console.log('Subscribed to', GPS_TOPIC);
                    }
                });
            mqttClient.subscribe(TELEMETRY_TOPIC, (err) => {
                if (err) console.error('Subscribe error:', err);
                else console.log('Subscribed to', TELEMETRY_TOPIC);
    });
        });

        mqttClient.on('message', (topic, message) => {
            console.log('MESSAGE RECEIVED');
            console.log('TOPIC:', topic);
            console.log('RAW:', message.toString());

            try {
                const data = JSON.parse(message.toString());

                if (topic === 'gps') {
                    console.log('GPS received:', data);
                    setTelemetry(prev => ({ ...prev, ...data, gps: data }));
                } else if (topic === TELEMETRY_TOPIC) {
                    console.log('Environmental telemetry received:', data);
                    setTelemetry(prev => ({
                ...prev,
                        temperature: data.temperature ?? data.temp ?? prev?.temperature,
                        humidity: data.humidity ?? prev?.humidity,
                        pressure: data.pressure ?? prev?.pressure,
            }));}
            } catch (e) {
                console.error('Failed to parse MQTT message', e);
            }
        });

        mqttClient.on('error', (err) => {
            setMqttConnected(false);
            console.error('MQTT Error:', err);
        });

        mqttClient.on('close', () => {
            setMqttConnected(false);
            console.log('MQTT Connection Closed');
        });

        mqttClient.on('disconnect', () => {
            setMqttConnected(false);
            console.log('MQTT Disconnected');
        });

        // --- Telemetry WS (backend relay for GPS) -------------------------
        let telemetryWs = null;
        let telemetryReconnect = null;

        const connectTelemetryWS = () => {
            const rawApi = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            let wsUrl;
            try {
                const u = new URL(rawApi);
                const proto = (u.protocol === 'https:' ? 'wss:' : 'ws:');
                wsUrl = `${proto}//${u.host.replace(/:\d+$/, u.port ? `:${u.port}` : '')}/ws/telemetry`;
            } catch (e) {
                // Fallback simple replace
                wsUrl = rawApi.replace(/^https?:/, rawApi.startsWith('https') ? 'wss:' : 'ws:') + '/ws/telemetry';
            }
            try {
                telemetryWs = new WebSocket(wsUrl);

                telemetryWs.onopen = () => {
                    console.log('Telemetry WS connected', wsUrl);
                };

                telemetryWs.onmessage = (evt) => {
                    try {
                        const msg = JSON.parse(evt.data);
                        if (msg.type === 'gps' && msg.payload) {
                            setTelemetry(prev => ({ ...prev, ...msg.payload, gps: msg.payload }));
                        }
                    } catch (e) {
                        console.error('Telemetry WS parse error', e);
                    }
                };

                telemetryWs.onclose = () => {
                    console.log('Telemetry WS closed — reconnecting in 3s');
                    telemetryReconnect = setTimeout(connectTelemetryWS, 3000);
                };

                telemetryWs.onerror = (e) => {
                    console.log('Telemetry WS error', e);
                    try { telemetryWs.close(); } catch {};
                };
            } catch (e) {
                console.error('Failed to open Telemetry WS', e);
                telemetryReconnect = setTimeout(connectTelemetryWS, 3000);
            }
        };

        connectTelemetryWS();

        // Clean up when hook unmounts
        const cleanupTelemetry = () => {
            if (telemetryReconnect) clearTimeout(telemetryReconnect);
            if (telemetryWs) {
                try { telemetryWs.close(); } catch (e) {}
                telemetryWs = null;
            }
        };


        return () => {
            mqttClient.end();
            cleanupTelemetry();
        };

    }, []);

    const sendMoveCommand = (direction) => {
        if (!client) {
            console.warn('MQTT not connected');
            return;
        }

        const payload = JSON.stringify({ direction: String(direction) });
        client.publish('robot/movement', payload, { qos: 1 });
        console.log('Movement command sent:', payload);
    };

    const sendSpeedCommand = (value) => {
        if (!client) return;
        client.publish('robot/speed', String(value), { qos: 1 });
        console.log('Speed command sent:', value);
    };

    const sendCameraToggle = (state) => {
        if (!client) return;
        const msg = state ? 'camera_on' : 'camera_off';
        client.publish('robot/camera', msg, { qos: 1 });
        console.log('Camera toggle sent:', msg);
    };

    const sendMicToggle = (state) => {
        if (!client) return;
        const msg = state ? 'mic_on' : 'mic_off';
        client.publish('robot/mic', msg, { qos: 1 });
        console.log('Mic toggle sent:', msg);
    };

    const sendLightsToggle = (state) => {
        if (!client) return;
        const msg = state ? 'lights_on' : 'lights_off';
        client.publish('robot/lights', msg, { qos: 1 });
        console.log('Lights toggle sent:', msg);
    };

    const sendModeCommand = (mode, subMode) => {
        if (!client) return;
        const payload = JSON.stringify({ mode, subMode });
        client.publish('robot/mode', payload, { qos: 1 });
        console.log('Mode command sent:', payload);
    };
    const sendCameraCommand = (direction) => {
        if (!client) return;
        const payload = JSON.stringify({ direction: String(direction) });
        client.publish('robot/camera_control', payload, { qos: 1 });
        console.log('Camera direction command sent:', direction);
    };

    return {
        client,
        telemetry,
        mqttConnected,
        sendMoveCommand,
        sendSpeedCommand,
        sendCameraToggle,
        sendMicToggle,
        sendLightsToggle,
        sendModeCommand,
        sendCameraCommand
    };
};