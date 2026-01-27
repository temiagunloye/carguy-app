# Starting the Mobile App

## Quick Start

From the project root directory, simply run:

```bash
npx expo start
```

Your terminal will **automatically** switch to Node v20 and display the QR code.

### First Time Setup (Already Done)
- ✅ Node v20 set as default
- ✅ Auto-load configured in `.zshrc`
- ✅ `.nvmrc` file created

## Scanning the QR Code

Once the QR code appears in your terminal:

### iOS
1. Open the **Camera** app on your iPhone
2. Point it at the QR code
3. Tap the notification that appears
4. The app opens in **Expo Go**

### Android
1. Open the **Expo Go** app
2. Tap "Scan QR Code"
3. Point your camera at the terminal QR code
4. The app loads automatically

## Manual Start (If Script Doesn't Work)

```bash
nvm use 20
npx expo start --clear
```

## Troubleshooting

**Error: `toReversed is not a function`**
- You're using Node v18 instead of v20
- Solution: Run `nvm use 20` before starting Expo

**QR Code Not Appearing**
- Make sure only ONE instance of Expo is running
- Kill all processes: `pkill -f "expo start"`
- Run `./start-expo.sh` again

**Cannot Scan QR Code**
- Ensure your phone and computer are on the same WiFi network
- Check firewall settings aren't blocking port 8081
