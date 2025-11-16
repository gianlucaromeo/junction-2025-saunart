# SAUN.ART

SAUN.ART turns sauna sensor data into a living audiovisual experience.

Today, sauna data (_temperature, humidity, proximity, occupancy_) is mostly used for dashboards and maintenance. **SAUN.ART** uses the same streams to generate real-time visuals and sound, so the sauna feels like a responsive, living space rather than a static room.

Inside the sauna, a heat-resistant screen shows generative art that reacts to the current state of the room: hotter saunas shift the color palette, humidity softens or sharpens the visuals, crowd size changes the intensity and density of motion. At the same time, a sound engine creates an adaptive soundscape that becomes calmer, denser, or more rhythmic depending on how the sauna is used.

Harvia’s existing sensors become the interface between bodies and the environment: hardware becomes experience.

How it works

1. We tap into Harvia’s temperature, humidity, proximity, and occupancy sensors in real time.

2. Each sensor value is normalized and mapped to visual and audio parameters (color, brightness, motion, tempo, rhythm density, texture).

3. Our graphics algorithms, made with **p5.js**, render abstract “sauna states” artwork on an in-sauna display. The composition continuously evolves based on live data instead of pre-rendered animations.

4. Our lightweight audio engine generates an adaptive soundscape (lo-fi / ambient). Sensor data controls tempo, patterns, and texture so that the sound reflects the atmosphere in the room.

5. As people enter, move, and heat builds up, both the visuals and sound shift. Users intuitively understand the sauna state through art, creating a continuous feedback loop between body, heat, and environment.

<br/>

SAUNA.ART & Harvia’s sensors turn sauna hardware into experience.

<br/>

A sauna is no longer silent. It speaks through motion and sound.

### Demo

https://github.com/user-attachments/assets/41298b40-8449-468a-a6dc-0a106045824a

