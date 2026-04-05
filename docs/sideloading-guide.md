# Sideloading the Deutsch B1 App on iPhone (Windows + Free Apple ID)

This guide explains how to install the app on your iPhone from Windows using **Sideloadly** and a free Apple ID. No paid Apple Developer account is needed.

> **Important limitation:** Free Apple IDs produce certificates that expire every 7 days. You will need to re-sign and reinstall the app every 7 days, but you do not need to rebuild or download a new `.ipa` unless the app itself was updated.

---

## One-Time Setup

Complete these steps once before your first install.

### 1. Install Sideloadly

1. Go to [https://sideloadly.io](https://sideloadly.io)
2. Download the **Windows** installer.
3. Run the installer and follow the prompts.

### 2. Install iTunes for Windows (direct download — not the Microsoft Store version)

Sideloadly needs iTunes for device detection. The **Microsoft Store version of iTunes does not expose the required USB drivers**, so you must use the direct download.

1. Go to [https://www.apple.com/itunes/](https://www.apple.com/itunes/) and scroll down to find the **"Windows"** direct download link (not the Microsoft Store button).
2. Download and run the installer.
3. After installation, open iTunes once to complete setup, then close it.

> If you already have iTunes installed from the Microsoft Store, uninstall it first, then install the direct-download version.

### 3. Connect your iPhone and trust the computer

1. Connect your iPhone to your Windows PC with a USB cable.
2. Unlock your iPhone.
3. When prompted on the iPhone screen: tap **Trust** and enter your passcode if asked.

---

## Installing the App (First Time + Every 7 Days)

Repeat these steps the first time you install, and again every 7 days when the certificate expires.

### Step 1 — Download the `.ipa` from GitHub Actions

1. Go to the repository on [github.com](https://github.com).
2. Click the **Actions** tab.
3. Click the latest successful workflow run.
4. Scroll down to the **Artifacts** section.
5. Click **`deutschb1-ios-ipa`** to download the zip file.
6. Unzip the downloaded file — you will find a `.ipa` file inside.

### Step 2 — Open Sideloadly

Launch Sideloadly. Your connected iPhone should appear in the device dropdown at the top.

### Step 3 — Load the `.ipa`

Drag and drop the `.ipa` file into the Sideloadly window, or click the iPhone icon to browse for it.

### Step 4 — Enter your Apple ID

Type your **Apple ID email address** into the "Apple account" field, then click **Start**.

### Step 5 — Enter your Apple ID password

When prompted, enter your Apple ID password. Sideloadly will use it to generate a signing certificate and sign the `.ipa`. This happens on your machine — the password is not stored.

> On the very first use, Sideloadly may ask for your password more than once while it generates the certificate. This is normal.

Wait for Sideloadly to finish. You will see a success message when the app has been installed on your iPhone.

### Step 6 — Trust the developer certificate on your iPhone

The app is installed but will be blocked until you trust the certificate:

1. On your iPhone, go to **Settings → General → VPN & Device Management**.
2. Under "Developer App", tap your **Apple ID email address**.
3. Tap **Trust "[your Apple ID]"** and confirm.

The app icon should now appear on your home screen and open normally.

---

## Re-signing Every 7 Days (No Rebuild Needed)

After 7 days the signing certificate expires and the app will stop launching. To fix it:

- The app itself has not changed — you do not need to download a new `.ipa`.
- Simply repeat **Steps 2 through 6** above using the same `.ipa` file you already have.
- Only download a new `.ipa` from GitHub Actions if the app was updated since your last install.

---

## Troubleshooting

### "Could not find device" in Sideloadly
- Make sure iTunes (the **direct download** version, not Microsoft Store) is installed and has been opened at least once.
- Try a different USB cable — some cables are charge-only and do not transfer data.
- Unlock your iPhone before connecting.
- Restart both Sideloadly and iTunes, then reconnect the phone.

### "Untrusted Developer" error when opening the app
- You skipped Step 6. Go to **Settings → General → VPN & Device Management**, tap your Apple ID, and tap **Trust**.

### "Maximum number of app IDs reached"
- Free Apple IDs are limited to **10 app IDs per 7-day window**.
- To free up slots: go to [https://appleid.apple.com](https://appleid.apple.com), sign in, navigate to your app IDs or certificates, and remove old/unused entries.
- Wait a moment, then try the Sideloadly install again.

### Sideloadly keeps asking for my password
- This is normal on the first use. Sideloadly is generating a local signing certificate with Apple's servers and may prompt several times during the process. Enter your password each time until it completes.
