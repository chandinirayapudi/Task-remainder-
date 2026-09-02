# TaskFlow Pro 📋

A smart voice-powered task reminder app with multilingual support (English, Telugu, Hindi).

## 📥 Download APK

**[⬇️ Download Latest Release (v1.0.0)](../../releases/latest)**

## Features

- 🎤 **Voice Input** — Speak tasks in English, Telugu, or Hindi
- 🌐 **Multilingual Support** — Auto-detects your language
- 🗣️ **Mother Tongue Setting** — Set your preferred language for better recognition
- ⏰ **Smart Reminders** — Recurring daily, weekly, monthly, yearly reminders
- 🔔 **Background Notifications** — Get notified even when app is closed
- 🏠 **Household Task Recognition** — Recognizes laundry, cleaning, appliance tasks
- 📊 **Dashboard & Analytics** — Track your task completion
- 🌙 **Dark Mode** — Easy on the eyes
- 💾 **Backup & Restore** — Export/import your reminders
- 📅 **Calendar View** — See tasks on a calendar

## Supported Languages

| Language | Voice Input | Task Parsing |
|----------|------------|--------------|
| English | ✅ | ✅ |
| తెలుగు (Telugu) | ✅ | ✅ |
| हिन्दी (Hindi) | ✅ | ✅ |

## Installation

### Download APK
1. Go to [Releases](../../releases/latest)
2. Download `TaskFlow-Pro-v1.0.0.apk`
3. Enable "Install from unknown sources" on your Android device
4. Install the APK

### Build from Source
```bash
# Clone the repository
git clone https://github.com/chandinirayapudi/Task-remainder-.git

# Install dependencies
npm install

# Sync to Android
npx cap sync android

# Build APK
cd android
./gradlew assembleDebug
```

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Mobile:** Capacitor (Android)
- **Voice:** Web Speech API
- **Notifications:** Capacitor Local Notifications

## License

MIT
