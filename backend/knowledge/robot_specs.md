# Robot Technical Specifications - Mock FYP

## Overview
The "WildGuard" robot is designed for wildlife monitoring and environmental protection. It features a high-definition camera, various sensors, and a long-range communication module.

## Navigation & Movement
- **Drive System**: 4WD with high-torque brushless motors.
- **Top Speed**: 5 km/h in standard mode, 12 km/h in burst mode.
- **Max Incline**: 35 degrees.
- **Turning Radius**: Zero (tank-turn capable).

## Power System
- **Battery**: 22.2V 10Ah Lithium-Polymer.
- **Operating Time**: 4-6 hours depending on terrain and camera usage.
- **Charging Time**: 2.5 hours with the standard 5A charger.

## Sensors & Hardware
- **Camera**: 4K Sony IMX sensor with night vision and 10x optical zoom.
- **Lidar**: 10-meter range for obstacle avoidance.
- **Connectivity**: WiFi 6, LoRa for telemetry, and optional 5G.
- **Operating Temperature**: -10°C to 50°C.

## Safety Protocols
1. **Low Battery**: The robot will automatically return to base if the battery drops below 15%.
2. **Signal Loss**: If the control signal is lost for more than 30 seconds, the robot enters "Hold Position" mode.
3. **Obstacle Detection**: The robot will halt immediately if an object is detected within 50cm.
