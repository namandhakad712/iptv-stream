<div align="center">

<img src="https://raw.githubusercontent.com/namandhakad712/iptv-stream/main/public/icon-512.png" alt="StreamOS Logo" width="120" style="border-radius: 24px; margin-bottom: 20px;" onerror="this.src='https://ui-avatars.com/api/?name=StreamOS&background=101014&color=fff&size=120&bold=true&rounded=true'"/>

# 📺 StreamOS

**The Ultimate Minimalist, High-Performance IPTV Web Player**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnamandhakad712%2Fiptv-stream)

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18+-61dafb?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

<br/>

[**Live Demo**](https://iptv-live-stream.vercel.app/) • [**Report Bug**](https://github.com/namandhakad712/iptv-stream/issues) • [**Request Feature**](https://github.com/namandhakad712/iptv-stream/issues) • [**Contribute**](#-contributing)

---

</div>

<br />

Welcome to **StreamOS**, a blazing-fast, strictly client-side React + Vite web application built for aggregating, filtering, and streaming `.m3u` and `.m3u8` IPTV playlists. Featuring a gorgeous glassmorphic UI, dynamic category/language/country filtering, intelligent mobile PWA support, and secure local cookie persistence—all **without** requiring a backend database!

<br />

## ✨ Core Features

| Feature | Description |
| :--- | :--- |
| **🚀 Serverless Architecture** | Entirely client-side. No databases to maintain or backend servers to pay for. |
| **📱 PWA & Mobile Native Feel** | Fully optimized Progressive Web App. Install directly to your iOS/Android home screen. Includes Haptic Touch, Double-Tap to Seek, Swipe Volume, and Screen Lock modes. |
| **🎨 Glassmorphic Interface** | Breathtaking, premium dark-mode UI meticulously crafted with TailwindCSS, featuring smooth GSAP micro-animations and Cinematic Background Ambilight. |
| **🌍 Dynamic Full-Scale Filtering** | Stacked filters that auto-update dynamically based on standard `.m3u` tags (`tvg-country`, `tvg-language`, `group-title`), allowing you to slice through thousands of channels instantly. |
| **💾 True Session Persistence** | Safely auto-saves your preferences, custom stream sources, volume, and playback configurations using secure browser cookies. |
| **🛠 Universal Format Support** | Natively plays HLS streams using the powerful `hls.js` engine, with adaptive bitrate/resolution selection, Data Saver mode, and an integrated fallback for native Apple/Safari devices. |
| **📡 Expandable Custom Sources**| Ships with incredible global directories, plus allows dynamic adding/removing of your own `.m3u` URLs directly from the UI! |
| **📸 Built-in Snapshot Tool** | Integrated canvas rendering module lets you take instant, high-quality screenshots of your favorite live TV moments. |

<br />

---

## ⚡ Quick Start (Local Setup)

Want to run this beautiful application on your local machine or contribute to the codebase? It takes just seconds to spin up.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/namandhakad712/iptv-stream.git
   cd iptv-stream
   ```

2. **Install dependencies:**
   *(Note: This project leverages React 18 and Tailwind CSS v3)*
   ```bash
   npm install
   ```

3. **Spin up the Vite Dev Server:**
   ```bash
   npm run dev
   ```

4. **Experience the Magic:**
   Open `http://localhost:5173/` in your browser.

<br />

## ☁️ Deployment (Vercel)

StreamOS includes a pre-configured `vercel.json` routing configuration out of the box to guarantee flawless SPA navigation.

1. Create a free account at [Vercel](https://vercel.com).
2. Click **Add New Project**.
3. Import this exact repository from your GitHub account.
4. Leave all settings exactly as default (Vercel auto-detects `Vite` and we have handled the rewrites).
5. Click **Deploy**.

*Within 60 seconds, your own globally distributed IPTV app will be live on the edge.*

<br />

---

## 🤝 Contributing

**StreamOS is entirely Open Source and community-driven!** We welcome all contributions, from bug fixes and UI enhancements to whole new feature implementations. 

### How to Contribute

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally: `git clone https://github.com/YOUR_USERNAME/iptv-stream.git`
3. **Create a new branch** for your feature: `git checkout -b feature/AmazingFeature`
4. **Make your changes** and test them thoroughly using `npm run dev`.
5. **Commit your changes** with descriptive commit messages: `git commit -m "Add some AmazingFeature"`
6. **Push to the branch**: `git push origin feature/AmazingFeature`
7. **Open a Pull Request** against the `main` branch of this repository.

### Development Guidelines
- Ensure your code follows the existing style and architecture (React functional components, Tailwind utility classes).
- If adding new icons, please use raw SVGs injected into our `Icons` object within `app.tsx` to maintain zero-dependency UI rendering.
- Test mobile responsiveness and dark-mode contrast before submitting UI changes.

<br />

---

## 🌐 Open Source Resources & Acknowledgements 

**StreamOS leverages the absolute full potential of massive, globally maintained open-source IPTV directories.** 

This powerful client natively taps into a globally unified directory of over **30,000+ public channels**, pulling standard structures, APIs, and metadata to deliver the ultimate viewing pipeline. 

Massive, profound acknowledgements to the following incredible open-source projects for meticulously maintaining these legal, vast public directories:

### 🏆 Included Core Repositories & APIs:

#### 1. [**IPTV-Org**](https://github.com/iptv-org/iptv) & [**IPTV-Org API**](https://github.com/iptv-org/api)
The backbone of our global feed. IPTV-Org maintains a staggering collection of publicly available, legally free IPTV channels from all over the world. StreamOS directly integrates their master streams:
- `index.m3u` (All 30k+ Channels globally)
- Curated Global Categories (`movies.m3u`, `news.m3u`, `sports.m3u`, `music.m3u`)
- *For developers:* Explore their rich data sources at their [API Documentation](https://github.com/iptv-org/api).

#### 2. [**Free-TV**](https://github.com/Free-TV/IPTV)
A beautifully and actively maintained list of completely free, public, and legal IPTV channels. We integrate their primary master lists natively.

#### 3. [**i.mjh.nz Aggregations**](https://i.mjh.nz/)
A pivotal community resource maintaining deeply updated live endpoint `.m3u8` lists for massive public broadcast television networks:
- [Pluto TV](https://i.mjh.nz/PlutoTV/) • [Plex Live TV](https://i.mjh.nz/Plex/) • [Samsung TV Plus](https://i.mjh.nz/SamsungTVPlus/) • [Roku Channel](https://i.mjh.nz/Roku/) • [Tubi TV](https://i.mjh.nz/Tubi/) • [PBS Network](https://i.mjh.nz/PBS/) • [Stirr TV](https://i.mjh.nz/Stirr/)

<br />

## ⚠️ Legal Disclaimer

**StreamOS** is strictly a **hobby project** created exclusively for educational and frontend development purposes, specifically demonstrating complex React state management, dynamic UI rendering, and HLS video parsing capabilities. 

This application **does not** host, store, download, cache, distribute, or broadcast any video media content. It acts purely as a dumb client-side web browser player that merely parses standard `.m3u` and `.m3u8` text formats and feeds them to the browser's native `<video>` APIs.

All default IPTV playlist URLs bundled with this repository (linked above) are **100% free, public, and open-source**. 

*Notice: If you believe any streamed content violates your copyright, please report or raise an issue directly with the respective third-party open-source playlist maintainers linked precisely above. This application possesses zero control over, and holds no affiliation with, any third-party media streams.*

<br />

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <br/>
  <b>Built with ❤️ by Naman</b>
</div>
