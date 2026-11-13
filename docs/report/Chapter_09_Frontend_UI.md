
# Chapter 9: Frontend — User Interface Design

---

## 9.1 Introduction

The frontend of the Smart Career Platform is built with **Next.js 16** and **React 19**, delivering a premium, visually stunning user experience. The interface combines cutting-edge web technologies — 3D WebGL visualization, glassmorphism, micro-animations, and data-driven charts — to create an immersive career intelligence dashboard. This chapter covers the project structure, design system, and all four application pages.

---

## 9.2 Technology Stack and Project Structure

The Next.js App Router organizes the application into four pages using the file-system routing convention. Key dependencies include Three.js (0.183.2) with @react-three/fiber and @react-three/drei for 3D WebGL rendering, Chart.js (4.5.1) with react-chartjs-2 for data visualization, Framer Motion (12.38.0) for animations, TailwindCSS ^4 for styling, Lucide React for icons, and react-tilt for 3D hover effects.

```
src/app/
├── layout.tsx          # Root layout — HTML shell, Google Fonts, global CSS
├── page.tsx            # Landing page — 3D WebGL brain visualization
├── globals.css         # TailwindCSS 4 integration + design tokens
├── login/page.tsx      # Authentication — Login & Registration forms
├── upload/page.tsx     # Resume upload — Drag-and-drop with animations
└── dashboard/page.tsx  # Analytics dashboard — Charts, career cards (564 LOC)
```

---

## 9.3 Design System and Global Styling

The root layout (`layout.tsx`) establishes the HTML document structure, SEO metadata (title and description), and loads the **Inter** font family from Google Fonts. All pages inherit this layout automatically through Next.js's nested layout system.

The `globals.css` file defines over 40 CSS custom properties (design tokens) organized into two visual themes:

- **Career Brand Colors:** Professional blue palette — primary (#2563eb), accent (#3b82f6), secondary (#0f172a), border (#e2e8f0), background (#f8fafc)
- **Neon Architect Theme:** Dark mode system — background (#0c0e11), primary (#a1faff), secondary (#00e3fe), tertiary (#64b3ff), with surface, on-surface, outline, and error variants

These tokens ensure visual consistency across all pages and enable theme switching through a single configuration point.

---

## 9.4 Landing Page — 3D WebGL Experience

The landing page creates a striking first impression using **Three.js** for 3D rendering within a React component tree. The scene consists of:

**Interactive Brain Sphere:** A wireframe sphere rendered with `MeshDistortMaterial`, which applies organic displacement effects. The mesh rotates continuously on both X and Y axes via the `useFrame` hook (running at ~60fps). Parameters include a distortion factor of 0.4, metalness of 0.8, and roughness of 0.2, creating a glowing, technological aesthetic.

**Floating Animation:** The `Float` component from `@react-three/drei` adds gentle hovering motion with configurable speed, rotation intensity, and float intensity — making the brain feel alive and responsive.

**Star Field:** A particle system of 3,000 stars with a radius of 100 units creates a deep space backdrop, enhancing the futuristic atmosphere.

**User Controls:** `OrbitControls` allows users to click and drag to rotate the camera around the brain, with auto-rotation enabled when idle.

**Hero Section:** Below the 3D canvas, a gradient text hero section displays the platform title, tagline, and call-to-action buttons linking to the login and upload pages.

> **\[SCREENSHOT PLACEHOLDER: Landing page showing the 3D brain visualization with animated stars and hero text\]**

---

## 9.5 Login/Registration Page

The authentication page features a **glassmorphic card** design — a semi-transparent card with `backdrop-blur-xl`, layered over animated background glow effects (blue and purple radial gradients with 120px blur radius).

**Toggle Animation:** Users switch between login and registration forms using a smooth `AnimatePresence` transition from Framer Motion. The registration form reveals an additional "name" field with a slide-down animation.

**Form Handling:** The login function sends credentials as `application/x-www-form-urlencoded` data (OAuth2 standard). Upon successful authentication, the JWT token, user ID, and email are stored in `localStorage`. Login redirects to `/dashboard`; registration redirects to `/upload` so new users can upload their resume immediately.

**Error Handling:** Inline error messages appear with an `AlertCircle` icon. Loading states display a spinner animation during API calls. Field validation checks for empty email and password fields before submission.

> **\[SCREENSHOT PLACEHOLDER: Login page with glassmorphic form and ambient glow effects\]**

> **\[SCREENSHOT PLACEHOLDER: Registration form variant with name field visible\]**

---

## 9.6 Resume Upload Page

The upload page provides a **drag-and-drop interface** enhanced with a 3D tilt effect using `react-tilt`. The upload area transitions through four visual states: Empty (dashed border with upload icon), Hovering (blue tint with glow), File Ready (green border with filename display and "Initiate Neural Scan" button), and Scanning (a dramatic neural scanner animation with a glowing blue horizontal line sweeping vertically).

During the scanning state, a pulsing CPU icon and "Extracting Skills" text appear. The extracted skills are stored in `localStorage` and the user is redirected to the dashboard.

> **\[SCREENSHOT PLACEHOLDER: Upload page in empty state with drag-and-drop area\]**

> **\[SCREENSHOT PLACEHOLDER: Scanning animation with holographic line sweep\]**

---

## 9.7 Dashboard — Analytics Command Center

The dashboard is the most complex page at **564 lines of code**, serving as the analytical command center where all backend intelligence converges into actionable visualizations.

### 9.7.1 Chart Visualizations

Four Chart.js charts provide different analytical perspectives: a **Radar chart** showing career path match percentages as a polygonal area plot, a **Bar chart** displaying extracted skill proficiency scores with gradient fills, a **Line chart** projecting 5-year market trends using solid lines for growing fields and dashed lines for declining fields, and a **Doughnut chart** showing skill gap distribution across career categories.

### 9.7.2 Career Path Cards

Each career path is presented as an expandable card containing a header with role name, description, and color-coded match percentage badge (green ≥70%, amber ≥50%, red <50%), a progress bar, direct search URLs for five job platforms, and an expandable accordion showing matched skills (green badges), missing skills (red badges), and a step-by-step learning roadmap.

### 9.7.3 AI Career Strategy

A dedicated section presents an AI-generated career strategy summary, aggregating insights from the skill analysis and market forecast data.

> **\[SCREENSHOT PLACEHOLDER: Dashboard top section with radar chart and skill bars\]**

> **\[SCREENSHOT PLACEHOLDER: Career path cards showing match percentages and platform links\]**

> **\[SCREENSHOT PLACEHOLDER: Expanded career card with matched/missing skills and roadmap timeline\]**

> **\[SCREENSHOT PLACEHOLDER: Market trends section with line chart and doughnut chart\]**

---

## 9.8 API Client Library (api.ts)

The `api.ts` module provides a centralized API client (`CareerAPI` object) with 8 methods, one for each backend endpoint. All protected endpoints automatically include the JWT token from `localStorage` via the `getAuthHeaders()` utility function. The client handles server-side rendering safety by checking for `window` availability before accessing `localStorage`.

---

## 9.9 Summary

This chapter covered the complete frontend implementation: a 3D WebGL landing page with Three.js, glassmorphic authentication forms with Framer Motion animations, a tilt-enabled drag-and-drop resume upload page with neural scanner animation, and a comprehensive analytics dashboard featuring four Chart.js visualizations, expandable career path cards, platform links, and AI strategy recommendations.

---

\newpage

