<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1VNSDubucdL9djMGIsE1qo2r9Rwoji1Lp

## Run Locally

**Prerequisites:** Node.js

### 1) Install dependencies
`npm install`

### 2) Create a Firebase Web app
1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Add a **Web** app to the project to get your config object (API key, project ID, etc.).
3. Enable the products you plan to use (Firestore, Auth, Storage, Functions).

### 3) Add your Firebase config as environment variables
Create a `.env.local` file in the project root with the values from the Firebase config snippet:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

If these values are missing, the app will start in a UI-only mode with mocked keys.

### 4) Run the app
`npm run dev`
