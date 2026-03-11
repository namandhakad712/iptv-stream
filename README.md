<div align="center">

# 📺 StreamOS

**The Ultimate Minimalist, High-Performance IPTV Web Player**

[![Vercel Deploy](https://img.shields.io/badge/Deploy_to-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/new/clone?repository-url=https%3A%2A%2Agithub.com%2Fnamandhakad712%2Fiptv-stream)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18+-61dafb?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

[**Live Demo**](https://iptv-stream-gamma.vercel.app/) (Replace with your Vercel URL) • [**Report Bug**](#)

---

</div>

<br />

StreamOS is a blazing-fast, strictly client-side React + Vite web application built for aggregating, filtering, and streaming `.m3u` and `.m3u8` IPTV playlists. It features a gorgeous glassmorphic UI, dynamic category/language/country filtering, and secure local cookie persistence—all without requiring a backend database!

<br />

## ✨ Features

- **🚀 Serverless Architecture**: Entirely client-side (PWA ready). No databases to maintain.
- **🎨 Glassmorphic Interface**: Breathtaking dark-mode UI with smooth micro-animations.
- **🌍 Dynamic Filtering Array**: Stacked filters auto-update based on source tags (`tvg-country`, `tvg-language`, `group-title`).
- **💾 Session Persistence**: Safely auto-saves your preferences, volume, layout width, and custom stream sources using secure browser cookies.
- **🛠 Comprehensive Format Support**: Natively plays HLS streams using `hls.js` with integrated fallback for native Apple devices.
- **📡 Custom M3U Sources**: Ship with 15+ rich default directories (global & region-specific), plus dynamic adding/removing of your own URLs!
- **📸 Snapshot Tool**: Integrated canvas rendering module lets you take screenshots of your favorite live TV moments.

<br />

## ⚡ Quick Start (Local Setup)

Want to run this beautiful application on your local machine? It takes just seconds.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/namandhakad712/iptv-stream.git
   cd iptv-stream
   ```

2. **Install exactly the locked dependencies:**
   *(Note: This project leverages Tailwind CSS v3)*
   ```bash
   npm install
   ```

3. **Spin up the Vite Dev Server:**
   ```bash
   npm run dev
   ```

4. **Enjoy the Magic:**
   Open `http://localhost:5173/` in your browser. 📺

<br />

## ☁️ Deployment (Vercel)

StreamOS includes a pre-configured `vercel.json` routing configuration out of the box.

1. Create a free account at [Vercel](https://vercel.com).
2. Click **Add New Project**.
3. Import this exact repository from your GitHub account.
4. Leave all settings exactly as default (Vercel auto-detects `Vite`).
5. Click **Deploy**.

*Within 60 seconds, your own globally distributed IPTV app will be live.*

<br />

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <br/>
  <b>Built with ❤️ by Naman</b>
</div>
