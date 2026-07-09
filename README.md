# Workout Pause Timer

A workout companion timer designed to optimize your training intervals. **Workout Pause Timer** focuses heavily on the critical parameter of your workouts: **the duration of your rest intervals between sets**.

---

## The Problem It Solves

In fitness training, progress isn't just about how hard you push during a set; it is equally determined by **how long you rest between sets**. 

Regular stopwatches capture split times, start secondary timers. This is not a countdown timer, nor is it a regular stopwatch. **Workout Pause Timer** logs how much time is spent in intervals instead. 

---

## How It Works

1.  **Start Your Set**: Start the stopwatch when you begin your set. The app tracks the absolute time elapsed.
2.  **Pause to Rest**: The instant you finish your set and hit pause, the app automatically:
    *   Logs the duration of your active set and your active **Rest (Pause) Tracker**
3.  **Resume**: When you start your next set, the previous pause interval is recorded into your history log, and the stopwatch restarts for your next active set.
4.  **Analyze Your Output**: The clean session feed details each set's active duration alongside its corresponding rest period, ensuring you maintain a perfect, consistent tempo throughout your entire workout.

---

## Screenshots

![App Demo](screenshots/demo.gif)  


---

## Download

For macOS (silicon) users, a pre-compiled DMG bundle of the desktop application is available directly in this repository **[here.](src-tauri/target/release/bundle/dmg/WorkoutPauseTimer_0.1.0_aarch64.dmg)**


If you wish to build from source yourself, see instructions below.

---

## Building from Source (with Tauri)

Workout Pause Timer is designed to be built as a lightweight, native desktop application for macOS, Windows, and Linux using **Tauri** and **React**.

### Prerequisites (All Operating Systems)

Before starting, ensure you have the following installed:
*   **Node.js** (v18 or higher recommended) & **npm**
*   **Rust & Cargo** (Follow instructions on [rustup.rs](https://rustup.rs/))

---

### 1. macOS Build Guide

#### OS-Specific Prerequisites
1.  Open your terminal and install Xcode Command Line Tools:
    ```bash
    xcode-select --install
    ```

#### Build Instructions
1.  Navigate to your extracted folder and install web dependencies:
    ```bash
    npm install
    ```
2.  Open the Tauri configuration file (`src-tauri/tauri.conf.json`) and update the `"identifier"` field:
    *   Replace `"com.tauri.dev"` with a unique identifier (e.g., `"com.yourname.workoutpausetimer"`). *This prevents bundle identifier conflicts on macOS.*
3.  Build the production bundle and package it into a native `.app` and `.dmg`:
    ```bash
    npx tauri build
    ```
4.  The compiled assets will be located in:
    `src-tauri/target/release/bundle/dmg/Workout Pause Timer.dmg`

---

### 2. Windows Build Guide

#### OS-Specific Prerequisites
1.  Download and run the [Visual Studio Installer](https://visualstudio.microsoft.com/visual-cpp-build-tools/).
2.  Select the **"C++ build tools"** workload and make sure the following individual components are checked:
    *   MSVC v143 - VS 2022 C++ x64/x86 build tools (or latest)
    *   Windows 10 SDK (or Windows 11 SDK)
3.  Restart your PC after the installation is complete.

#### Build Instructions
1.  Install web dependencies:
    ```bash
    npm install
    ```
2.  Open `src-tauri/tauri.conf.json` and change the bundle `"identifier"` (e.g., `"com.yourname.workoutpausetimer"`).
3.  Build the application executable (`.exe` and `.msi` installers):
    ```bash
    npx tauri build
    ```
4.  The compiled installers will be located in:
    `src-tauri/target/release/bundle/msi/Workout Pause Timer.msi`

---

### 3. Linux Build Guide

#### OS-Specific Prerequisites
Depending on your package manager, install the required development headers, WebKit2GTK engine, and build systems.

**Ubuntu / Debian-based systems:**
```bash
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

#### Build Instructions
1.  Install web dependencies:
    ```bash
    npm install
    ```
2.  Open `src-tauri/tauri.conf.json` and change the bundle `"identifier"` (e.g., `"com.yourname.workoutpausetimer"`).
    

3.  Build the application (`.deb` packages or AppImages):
    ```bash
    npx tauri build
    ```
4.  The output packages will be located in:
    `src-tauri/target/release/bundle/deb/`

---

## Global Keyboard Shortcuts

Control your intervals without breaking form:

| Key | Action |
| --- | --- |
| **`Space`** | Start / Pause |
| **`R`** | Reset Stopwatch & Session |


---

## License

This project is licensed under the **MIT License** - feel free to share, modify, and build upon it.
