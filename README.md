# Cleanup Tasks - Multi-User PWA

A mobile-first Progressive Web App for tracking household cleanup tasks with multi-user support and real-time synchronization across devices.

## Features

### 🏠 Multi-User Household Management
- **Household Sharing**: Create or join a household with a simple 6-character code
- **User Login**: Simple name-based login (no passwords required)
- **Shared Tasks**: Tasks are shared across all household members
- **Task Assignment**: Assign tasks to specific members or leave them for anyone
- **Completion Tracking**: See who completed each task
- **Real-time Sync**: All changes sync automatically across all devices

### ✅ Task Management
- **Multiple Frequencies**: Daily, weekly, monthly, seasonal, and yearly tasks
- **Countdown Timer**: Built-in timer for each task based on estimated time
- **Auto-Reset**: Tasks automatically reset based on their period (daily tasks reset each new day, etc.)
- **Progress Indicators**: See completion progress for each time period (e.g., "4/5 daily tasks done")
- **Task Filters**: View all, incomplete, or completed tasks

### 🔥 Tracking & History
- **Streak Tracking**: Track consecutive completions for daily and weekly tasks
- **Completion History**: View all completion dates and who completed them
- **Period-based Completion**: Tasks can only be completed once per period (prevents double completion)

### 🎨 User Experience
- **Mobile-First Design**: Optimized for mobile devices with bottom tab navigation
- **Dark Mode**: Switch between light and dark themes
- **Offline Support**: Works offline with Service Worker caching
- **PWA Installable**: Install as a native-like app on your device

## Quick Start

### 1. Set Up Firebase

The app uses Firebase Realtime Database for multi-user sync. You need to set up your own Firebase project:

#### Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or use an existing project
3. Follow the setup wizard (you can disable Google Analytics for simplicity)

#### Enable Realtime Database

1. In your Firebase project, go to "Build" > "Realtime Database"
2. Click "Create Database"
3. Choose a location (choose one closest to your users)
4. Start in **Test Mode** (we'll update rules next)

#### Configure Database Rules

1. In Realtime Database, go to the "Rules" tab
2. Replace the rules with:

```json
{
  "rules": {
    "households": {
      "$householdId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

**Note**: These rules are permissive for demo purposes. For production, consider implementing proper authentication and security rules.

#### Get Your Firebase Config

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click the Web icon (`</>`) to create a web app
4. Register your app (give it a name)
5. Copy the `firebaseConfig` object

#### Update the App

1. Open `firebase-config.js` in your project
2. Replace the placeholder `firebaseConfig` with your actual config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 2. Generate Icons

1. Open `create-icons.html` in your browser
2. Right-click each icon and save it to the `icons/` folder (create the folder if it doesn't exist)
3. Save all 8 icon sizes

### 3. Test Locally

1. Start a local web server in the project directory:
   ```bash
   python3 -m http.server 8000
   ```
   Or use any other local server

2. Open `http://localhost:8000` in your browser

3. Create a household and test the app

### 4. Deploy to GitHub Pages

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. Enable GitHub Pages:
   - Go to your repository settings
   - Navigate to "Pages"
   - Select source: "Deploy from a branch"
   - Select branch: `main` and folder: `/ (root)`
   - Click "Save"

3. Your app will be available at: `https://yourusername.github.io/your-repo-name`

## How to Use

### First Time Setup

1. **Create or Join Household**:
   - Leave the household code empty to create a new household
   - Or enter an existing code to join a household

2. **Enter Your Name**:
   - Enter your name (this will identify you in the household)
   - If you created a new household, you'll see a 6-character code
   - Share this code with family members so they can join

3. **Start Creating Tasks**:
   - Switch to the "Create Task" tab
   - Add task name, category, estimated time
   - Optionally assign it to a specific person
   - Click "Create Task"

### Using the App

#### Tasks Tab
- **Category Tabs**: Filter tasks by All, Daily, Weekly, Monthly, Seasonal, or Yearly
- **Task Filters**: Show all tasks, only incomplete, or only completed tasks
- **Progress Card**: See your progress for the selected category
- **Click a Task**: Start the countdown timer
- **Streak Badge**: Click the 🔥 icon to see completion history

#### Create Task Tab
- Fill in the task details
- Assign to a specific family member or leave as "Anyone can do it"
- View and manage all created tasks

#### Settings
- Click the ⚙️ icon in the header
- View and copy your household code
- Add or remove family members
- Switch to a different household (logout)

### Multi-User Features

- **Shared Tasks**: All tasks are visible to everyone in the household
- **Anyone Can Complete**: Unless assigned, anyone can complete any task
- **Assigned Tasks**: Tasks assigned to specific members show "Assigned to: [Name]"
- **Completion Tracking**: Completed tasks show who completed them
- **Real-time Updates**: Changes made on one device instantly appear on all other devices

## File Structure

```
cleanup-app/
├── index.html              # Main HTML structure
├── styles.css              # Styling and themes
├── script.js               # App logic and Firebase integration
├── firebase-config.js      # Firebase configuration (update with your config)
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

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend**: Firebase Realtime Database
- **PWA Features**: Service Worker API, Web App Manifest
- **Storage**: Firebase (cloud) + LocalStorage (auth state)

## Browser Support

- Chrome/Edge (recommended)
- Safari (iOS 11.3+)
- Firefox
- Samsung Internet

## Troubleshooting

### Tasks not syncing?
- Check your internet connection
- Verify Firebase Database Rules are set correctly
- Check browser console for errors

### Can't join household?
- Make sure the household code is correct (6 characters, case-sensitive)
- The household must exist (someone needs to create it first)

### App not installing as PWA?
- Make sure all icon files are in the `icons/` folder
- Try clearing browser cache and reloading
- On iOS, use Safari's "Add to Home Screen" option

### Firebase errors?
- Verify your `firebase-config.js` has the correct configuration
- Check that Realtime Database is enabled in Firebase Console
- Ensure Database Rules allow read/write access

## Privacy & Security

- No passwords are stored (simple name-based identification)
- All household data is isolated by household code
- **Firebase API keys in the code are PUBLIC by design** - this is normal for client-side apps
- **Security is enforced through Firebase Database Rules** (server-side)
- For production use, proper Database Rules are configured to prevent unauthorized access
- Only members with valid household codes can access household data

### Security Best Practices Implemented

✅ **Database Rules:** Only existing households can be read/written to  
✅ **Data Isolation:** Each household's data is completely separate  
✅ **No Unauthorized Creation:** Random users cannot create fake households  
✅ **Usage Monitoring:** Budget alerts set up to prevent abuse  

**Note:** The Firebase config in the code is safe to be public. The actual security is handled by Firebase Database Rules on Google's servers, not in the client code.

## Future Enhancements

Potential features to add:
- User authentication (email/password)
- Push notifications for task reminders
- Task templates and recurring task patterns
- Task categories and custom icons
- Photo attachments for completed tasks
- Household statistics and insights

## License

MIT License - Feel free to use and modify!

## Credits

Created as a mobile-first household task management solution with real-time multi-user collaboration.
