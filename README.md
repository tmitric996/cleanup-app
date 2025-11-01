# Cleanup Tasks - PWA

A mobile-first Progressive Web App for tracking daily, weekly, monthly, seasonal, and yearly cleanup tasks.

## Features

- ✅ Task management with different frequencies (daily, weekly, monthly, seasonal, yearly)
- 🔥 Streak tracking for daily and weekly tasks
- ⏱️ Built-in countdown timer for each task
- 📊 Completion history tracking
- 📈 Progress indicators for each time period
- 🌙 Dark mode support
- 💾 Offline functionality with Service Worker
- 📱 Installable as mobile app (PWA)

## Installation as Mobile App

### On Mobile (iOS/Android):

1. Visit the app URL in your mobile browser (Chrome/Safari)
2. Look for "Add to Home Screen" or "Install App" prompt
3. Tap "Install" or "Add"
4. The app will appear on your home screen like a native app

### On Desktop:

1. Visit the app URL in Chrome/Edge
2. Look for the install icon in the address bar (⊕)
3. Click "Install"

## Setup for GitHub Pages

1. Create a folder named `icons` in the project root
2. Open `create-icons.html` in your browser
3. Right-click and save each generated icon to the `icons/` folder
4. Push all files to GitHub
5. Enable GitHub Pages in repository settings
6. Your app will be available at: `https://yourusername.github.io/cleanup`

## File Structure

```
cleanup/
├── index.html              # Main HTML file
├── styles.css              # Styling
├── script.js               # App logic
├── manifest.json           # PWA manifest
├── service-worker.js       # Service worker for offline support
├── create-icons.html       # Icon generator utility
├── icons/                  # App icons (create this folder)
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   └── icon-512x512.png
└── README.md               # This file
```

## Technologies Used

- Vanilla JavaScript (ES6+)
- CSS3 with CSS Variables
- HTML5
- Service Worker API
- LocalStorage API
- Web App Manifest

## Browser Support

- Chrome/Edge (recommended)
- Safari (iOS 11.3+)
- Firefox
- Samsung Internet

## License

MIT License - Feel free to use and modify!

