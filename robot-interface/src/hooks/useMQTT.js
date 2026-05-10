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

        const msg = JSON.stringify({
            move: direction
        });

        client.publish(
            'robot/control',
            msg,
            { qos: 1 }
        );

        console.log('Command sent:', msg);
    };

    return {
        client,
        telemetry,
        sendMoveCommand
    };
};