A web app that records the movement of garbage in and out of a processing facility.
- When feedstock moves into a facility, we record the weight in kilograms of the feedstock and the name of the feedstock producer.
- We record when processed feedstock leaves the facility to go to a sequestration site - we record the weight of the processed garbage and the name of the sequestration site.
- Feedstock producers and sequestration sites are selected from dropdown lists when recording weights.
- There are separate CRUD pages for feedstock producers and sequestration sites.

This is a Next.js app using TypeScript and Tailwind. Use shadcn slash ui for all components. Follow a clean, minimal aesthetic with consistent spacing, a neutral color palette, and generous whitespace. Use Tailwind’s default type scale, rounded corners, and subtle shadows. Never write raw CSS files. Ask me to pick a single accent color and a font from Google Fonts up front, so it feels intentional.

Notes:
- Arin (CEO) says this must be a mobile friendly app, since data entry will be done in the field. But data analysis will be done with desktop primarily.
- Post version 1.0, we want to integrate this with an IoT framework to avoid manually entering weights. Viam?
