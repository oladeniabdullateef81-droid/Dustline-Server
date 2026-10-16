DUSTLINE OFF-ROAD — MULTIPLAYER PROJECT

FILES
- Dustline_Off-Road.html: game
- server.js: WebSocket multiplayer relay server
- package.json: Node.js dependencies and start command
- render.yaml: deployment blueprint for Render

RUN LOCALLY (first test)
1. Install Node.js 18 or newer.
2. Open Command Prompt/Terminal in this folder.
3. Run: npm install
4. Run: npm start
5. Open http://localhost:3000

IMPORTANT: localhost is only your computer. Friends on different networks cannot join through localhost.

DEPLOY ONLINE WITH RENDER
1. Put the contents of this project folder in a GitHub repository. Keep server.js, package.json, render.yaml, and Dustline_Off-Road.html together in the repository root.
2. Sign in to Render and choose New > Blueprint (or create a Web Service connected to that repository).
3. If using Blueprint, Render reads render.yaml. If creating a Web Service manually, choose Node and use build command `npm install` and start command `npm start`.
4. Wait for deployment to finish, then open the public HTTPS URL Render gives you. The game connects to the same host's `/ws` WebSocket endpoint automatically.
5. Open that same public game URL on two different devices/browsers and test Multiplayer.

HOSTING NOTE
A free hosting plan can have limits or sleep while idle. Check the provider's current plan details. An always-on server may require a paid plan. The server must remain running for online multiplayer.

TEST STATUS
The project files are prepared for deployment, but this package has not been deployed to a live hosting account or tested with two real internet-connected devices. A public URL and live multiplayer test are still required to confirm the full experience.
