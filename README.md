# Dustline Off-Road Multiplayer (GitHub + Render)

This version removes the Claude room API and uses a normal Socket.IO server. The game and multiplayer backend are served by the same Render web service, so the Render URL works without an extra API key or same-Wi-Fi requirement.

## Deploy using GitHub and Render

1. Extract this ZIP.
2. Create a new GitHub repository and upload **all files inside this folder** (especially `index.html`, `server.js`, `package.json`, and `render.yaml`). Do not upload only the HTML file.
3. In Render, choose **New + → Web Service**, connect that GitHub repository, and deploy it. Render should detect Node; use build command `npm install` and start command `npm start` if it asks.
4. Open the `onrender.com` service URL. Test `/health` — it should show JSON with `"ok": true`.
5. Open the game using the Render URL and try Create Server, then join it from another device/browser using the same Render URL. Different networks are supported; both devices need internet.

## If you also use GitHub Pages

GitHub Pages cannot run the Node multiplayer server; it only hosts static files. The Render-hosted game is already configured to connect to its own server. To play from a GitHub Pages copy, edit `index.html` and replace `https://YOUR-RENDER-SERVICE.onrender.com` in the `DUSTLINE_SERVER_URL` line with your real Render service URL, for example `https://your-service-name.onrender.com`, then commit that change to GitHub. Keep the Render server running.

## Notes

- No Claude account or Claude room capability is used.
- No multiplayer API key is required.
- Render free services may sleep when idle, so the first connection after inactivity can take a little longer.
- The game still loads some third-party browser assets (Three.js/fonts) from their CDNs.
