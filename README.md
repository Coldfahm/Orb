# Orb

Orb is my desktop companion project: a small, always-on-top assistant that brings quick tools and a playful interface to the desktop.

## What it can do

- Move around the desktop and open its tools from a radial menu.
- Ask questions by voice and hear responses spoken aloud.
- Launch applications and use a compact command panel.
- Set focus timers, choose ambient sounds, and use media controls.
- Keep a temporary file stash and access clipboard tools.
- Show desktop telemetry when running as a native application.

In the Windows desktop build, Orb adjusts system volume and supported display brightness directly. Wi-Fi, Bluetooth, power, notifications, and Night Light shortcuts open the matching Windows Settings pages. Display brightness depends on monitor support; unsupported controls report an error instead of changing only Orb's appearance. Browser preview mode does not change Windows settings.

## Run locally

You’ll need Node.js 22 or later. For AI responses, provide a Gemini API key in a `.env` file at the project root:

```env
GEMINI_API_KEY=your_api_key_here
```

Install dependencies and start the development server:

```powershell
npm install --legacy-peer-deps
npm run dev
```

The development server runs at `http://localhost:3000`. Keep the API key private and do not commit your `.env` file.

Without a working API key, the assistant may return local fallback responses instead of generated answers.

## Build the Windows desktop app

Install Node.js 22 or later, Rust with the MSVC toolchain, Visual Studio C++ Build Tools, and the WebView2 Runtime. Then run:

```powershell
npm install --legacy-peer-deps
npm run tauri -- build --bundles nsis
```

The Windows installer is created in:

```text
src-tauri/target/release/bundle/nsis/
```

## Tech

Orb is built with React, TypeScript, Vite, and Tauri, with a Rust desktop layer.
