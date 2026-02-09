# BLE SVS Infinite Presets

> **🚧 WORK IN PROGRESS (WIP) 🚧**
> 
> This project is currently under active development. Features and UI are subject to change.

An Electron application for managing SVS presets with advanced fallback logic and valid/loadable templates.

## Features

- **Now Playing Integration**: Automatically detects current track/artist/release.
- **Smart Presets**: Saves and loads presets based on Track, Artist, or Release.
- **Target Fallback**: Set a specific template as a fallback if no specific preset is found.
- **Dark Mode**: Fully thematic UI respecting system preferences.
- **Sidebar Management**: Load, save, and manage templates directly from the sidebar.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.0+)

### Installation

```bash
bun install
```

### Development

Run the Electron app in development mode:

```bash
bun run electron:dev
```

### Building

Build the application for production:

```bash
bun run electron:build
```

## Roadmap

As we move towards a stable 1.0 release, we plan to simplify the installation process significantly:

-   **One-Line Installation**: Install the app instantly via a simple `curl` command.
-   **Direct Downloads**: Pre-built binaries (`.dmg`, `.exe`) will be available directly from the repository releases, removing the need to build from source.
-   **Auto-Updates**: Seamless updates for installed applications.
