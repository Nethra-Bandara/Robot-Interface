import { useState, useEffect } from 'react';
import mqtt from 'mqtt';

const MQTT_URL =
    'wss://002277b56cde45b29a96d3dd3ef81785.s1.eu.hivemq.cloud:8884/mqtt';

const options = {
    username: 'robot_interface',
    password: 'Pwd12345',
};

export const useMQTT = () => {

    const [client, setClient] = useState(null);
    const [telemetry, setTelemetry] = useState(null);

    useEffect(() => {

        const mqttClient = mqtt.connect(MQTT_URL, options);

        setClient(mqttClient);

        mqttClient.on('connect', () => {

            console.log('Connected to MQTT Broker');

            mqttClient.subscribe('robot/telemetry', (err) => {

                if (err) {
                    console.error('Subscribe error:', err);
                } else {
                    console.log('Subscribed to robot/telemetry');
                }
            });
        });

        mqttClient.on('message', (topic, message) => {

            console.log('MESSAGE RECEIVED');

            console.log('TOPIC:', topic);

            console.log('RAW:', message.toString());

            if (topic === 'robot/telemetry') {

                try {

                    const data = JSON.parse(
                        message.toString()
                    );

                    console.log('Pi Stats:', data);

                    setTelemetry(data);

                } catch (e) {

                    console.error(
                        'Failed to parse telemetry',
                        e
                    );
                }
            }
        });

        mqttClient.on('error', (err) => {
            console.error('MQTT Error:', err);
        });

        mqttClient.on('close', () => {
            console.log('MQTT Connection Closed');
        });

        return () => {
            mqttClient.end();
        };

    }, []);

    const sendMoveCommand = (direction) => {
        if (!client) {
            console.warn('MQTT not connected');
            return;
        }

        const msg = String(direction);
        client.publish('robot/control', msg, { qos: 1 });
        console.log('Movement command sent:', msg);
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

    const sendCameraCommand = (direction) => {
        if (!client) return;
        client.publish('robot/camera_control', String(direction), { qos: 1 });
        console.log('Camera direction command sent:', direction);
    };

    return {
        client,
        telemetry,
        sendMoveCommand,
        sendSpeedCommand,
        sendCameraToggle,
        sendMicToggle,
        sendLightsToggle,
        sendCameraCommand
    };
};