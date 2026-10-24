<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/87262869-f004-42c7-8c2c-04a279918f25

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Build the Windows desktop installer

The desktop app uses Tauri. On Windows, install Node.js 22, Rust (MSVC toolchain), the Visual Studio C++ Build Tools, and the WebView2 Runtime.

```powershell
npm ci --legacy-peer-deps
npm run tauri -- build --bundles nsis
```

The NSIS installer (`.exe`) is written to `src-tauri/target/release/bundle/nsis/`.

The **Build Windows EXE** GitHub Actions workflow runs on pushes, pull requests, and version tags (`v*`). Download the installer from the workflow run's artifacts. To publish a GitHub Release, push a version tag or manually run the workflow with an optional release tag.
