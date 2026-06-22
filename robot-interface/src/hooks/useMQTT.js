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
    const [mqttConnected, setMqttConnected] = useState(false);

    useEffect(() => {

        const mqttClient = mqtt.connect(MQTT_URL, options);

        setClient(mqttClient);

        mqttClient.on('connect', () => {
            setMqttConnected(true);
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

        return () => {
            mqttClient.end();
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