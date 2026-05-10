import { useState, useEffect } from 'react';
import mqtt from 'mqtt';

const MQTT_URL = 'wss://002277b56cde45b29a96d3dd3ef81785.s1.eu.hivemq.cloud:8883/mqtt';
const options = { username: 'Robot_Interface', password: 'PasswordMy1' };

export const useMQTT = () => {
    const [client, setClient] = useState(null);
    const [telemetry, setTelemetry] = useState(null); // This will hold your Pi Stats

    useEffect(() => {
        // Connect when the component mounts
        const mqttClient = mqtt.connect(MQTT_URL, options);
        setClient(mqttClient);

        mqttClient.on('connect', () => {
            console.log('Connected to MQTT Broker');
            mqttClient.subscribe('robot/telemetry');
        });

        mqttClient.on('message', (topic, message) => {
            if (topic === 'robot/telemetry') {
                try {
                    const data = JSON.parse(message.toString());
                    console.log("Pi Stats:", data);
                    setTelemetry(data); // Update React state to trigger UI changes
                } catch (e) {
                    console.error("Failed to parse telemetry data", e);
                }
            }
        });

        // Cleanup connection when component unmounts
        return () => {
            if (mqttClient) {
                mqttClient.end();
            }
        };
    }, []);

    // Helper function to send commands
    const sendMoveCommand = (direction) => {
        if (client) {
            const msg = JSON.stringify({ move: direction });
            client.publish('robot/control', msg);
        } else {
            console.warn('MQTT client not connected');
        }
    };

    return { telemetry, sendMoveCommand };
};
