# Premium Scrollytelling Experience

A high-performance scroll-driven animation website that plays a 192-frame sequence as the user scrolls, creating a cinematic, immersive experience.

## Overview

The site pins the first section to the viewport while the user scrolls through all 192 pre-rendered frames on a `<canvas>` element. Once the animation completes, normal page scrolling resumes into the content sections below.


---

## 📽️ Application Demo
![App Demo](demo.gif)

*(Above is a demonstration of the batch processing workflow and AI upscaling capabilities.)*

---


## Tech Stack

| Layer | Technology |
|---|---|
| Animation | GSAP + ScrollTrigger |
| Smooth scroll | Lenis |
| Rendering | HTML5 Canvas (sequential JPEG frames) |
| Styling | Vanilla CSS (glassmorphism, dark theme) |
| Build | Vite |

## Project Structure

```
webapp/
├── index.html        # Entry point and page structure
├── main.js           # Scroll logic, canvas sequencing, GSAP setup
├── style.css         # Global styles, animations, glassmorphism panels
├── src/              # Additional source modules
└── public/           # Pre-rendered animation frames (001.jpg … 192.jpg)
```

## Getting Started

```bash
cd webapp
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## How It Works

1. **Preloading** — All 192 JPEG frames are loaded into memory on startup; a progress bar tracks loading.
2. **Pinned section** — GSAP `ScrollTrigger` pins the `#animation-section` for a scroll distance proportional to the frame count.
3. **Frame scrubbing** — The current scroll progress maps linearly to a frame index; the frame is drawn on the canvas each tick.
4. **Content sections** — After the animation completes, the page scrolls naturally through three feature/hero sections.
5. **Pagination nav** — Fixed dot-navigation lets users jump between sections directly.

## Performance Notes

- Frames are decoded and cached as `HTMLImageElement` objects to avoid per-frame decoding cost.
- Canvas draw calls use `drawImage` only when the target frame index changes.
- Lenis provides lerp-based smooth scrolling without fighting the GSAP pin.
