# CS2 RCON Commander Pro

A high-performance, precision web interface for managing Counter-Strike 2 servers via RCON. Built with React and Node.js, featuring a clean "CS-style" UI with real-time feedback and advanced management tools.
It may work with other games, but is not tested for anything else than CS2 (and for the moment, I will not test it with anything else)

![CS2 Commander Preview](https://raw.githubusercontent.com/ggmartinez/cs2-rcon-commander/main/preview.png)

## 🚀 Getting Started

### Method 1: Docker (Recommended)
The easiest way to run the commander is using the official Docker image.

```bash
docker run -d \
  -p 3000:3000 \
  -e SERVER_IP=your_server_ip \
  -e RCON_PASSWORD=your_rcon_password \
  --name cs2-commander \
  ggmartinez/cs2-rcon-commander
```

### Method 2: Local Installation
1. **Clone and Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configuration**:
   Copy `.env.example` to `.env` and fill in your server details (optional, you can also login via the UI).
   ```bash
   cp .env.example .env
   ```

3. **Run in Development**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

## 🛠 Configuration (Environment Variables)

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_IP` | The IP address or hostname of your CS2 server | - |
| `SERVER_PORT` | The RCON port of your server | `27015` |
| `RCON_PASSWORD` | The RCON password set on your server | - |
| `DEBUG` | Enable verbose logging | `false` |

## ✨ Key Functionalities

### 📊 Real-time Status
* **System Efficiency**: Monitor server performance metrics.
* **TPS & VAR**: Track Tickrate Precision and Variance directly from RCON status.
* **Quick Controls**: Instant access to common tasks like restarting rounds or changing maps.

### ⌨️ Advanced Console
* High-performance command input with history.
* Syntax highlighting for RCON responses.
* Interactive feedback for executed commands.

### 👥 Player Management
* Real-time list of connected players.
* One-click actions: Kick, Ban, Mute, or change teams.
* Detection of Bot vs. Human players.

### 🗺 Map & Workshop Center
* **Smart Map Switching**: Supports vanilla maps and Workshop maps.
* **Workshop Integration**: Automatically fetches your server's workshop maps using `ds_workshop_listmaps`.
* **Visual Sorting**: Organize maps by name or by source (Default/Workshop).

### ⚙️ Game Mode & CVars
* Switch between Competitive, Casual, Wingman, and more.
* Searchable CVar browser for deep server tweaking.
* Presets for common competitive configurations.

### 🎨 Custom Aesthetics
Includes several built-in color themes to match your setup:
* **Classic Dark** (Default)
* **Nord Arctic**
* **Gruvbox Retro**
* **Terminal Green**
* **Cyberpunk**
* **Monokai**
* and more...

## Credits
✨ Built with **[Google AI Studio](https://aistudio.google.com/)**
Map thumbnails are fetched from [https://github.com/ggMartinez/CS2-Maps-Images](https://github.com/ggMartinez/CS2-Maps-Images)




