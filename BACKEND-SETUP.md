# Portfolio Website - Backend Setup Guide

This guide walks you through setting up the backend features for your portfolio website.

## Overview

Phase 5 adds three backend capabilities:

1. **Contact Form** → Google Apps Script (sends emails + logs to Sheet)
2. **Call Scheduling** → Cal.com integration
3. **Live Stats** → JSON file served from your homelab

---

## 1. Contact Form Backend (Google Apps Script)

### Setup Steps

1. **Create a Google Sheet** (optional, for logging)
   - Go to [Google Sheets](https://sheets.google.com)
   - Create a new spreadsheet named "Portfolio Contact Form"
   - Add headers in Row 1: `Timestamp | Name | Email | Message | Status | Source`
   - Copy the Sheet ID from the URL (between `/d/` and `/edit`)

2. **Create the Apps Script**
   - Go to [Google Apps Script](https://script.google.com)
   - Click "New Project"
   - Name it "Portfolio Contact Form Backend"
   - Delete the default code and paste the contents of `contact-form-backend.gs`

3. **Configure the Script**
   - Update the `CONFIG` object at the top:
     ```javascript
     const CONFIG = {
       recipientEmail: 'your-email@gmail.com',
       yourName: 'Your Name',
       sheetId: 'YOUR_SHEET_ID_HERE', // or null to disable logging
       sendAutoReply: true,
       // ... etc
     };
     ```

4. **Test the Script**
   - Click the dropdown next to "Run" and select `testEmailSend`
   - Click Run and authorize the script when prompted
   - Check your email for test messages

5. **Deploy as Web App**
   - Click **Deploy** > **New deployment**
   - Click the gear icon and select **Web app**
   - Set:
     - Description: "Contact Form v1"
     - Execute as: **Me**
     - Who has access: **Anyone**
   - Click **Deploy**
   - Copy the **Web app URL**

6. **Update Your Website**
   - Open `index.html`
   - Find `CONTACT_FORM_CONFIG` in the JavaScript section
   - Set `appsScriptUrl` to your deployed URL:
     ```javascript
     const CONTACT_FORM_CONFIG = {
       appsScriptUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
       fallbackEmail: 'your-email@gmail.com'
     };
     ```

### Testing the Form

1. Deploy your updated website
2. Fill out the contact form and submit
3. Check your email for the notification
4. Check the Google Sheet for the logged entry (if configured)

---

## 2. Cal.com Scheduling Setup

### Setup Steps

1. **Create a Cal.com Account**
   - Go to [cal.com](https://cal.com) and sign up (free)
   - Complete your profile

2. **Connect Your Calendar**
   - Go to Settings > Calendars
   - Connect your Google Calendar (recommended)

3. **Create an Event Type**
   - Go to Event Types > New
   - Create "Portfolio Discussion" or "30-Minute Chat"
   - Set duration (30 min recommended)
   - Configure availability hours
   - Save

4. **Get Your Booking Link**
   - Your link will be: `https://cal.com/your-username/30min`
   - Or whatever you named your event type

5. **Update Your Website**
   - Open `index.html`
   - Find all `href="https://cal.com"` links
   - Replace with your actual Cal.com booking link:
     ```html
     <a href="https://cal.com/your-username/30min" ...>Schedule a Call</a>
     ```

### Optional: Embed Modal

For a more integrated experience, you can embed Cal.com in a modal:

```html
<!-- Add to <head> -->
<script src="https://cal.com/embed.js"></script>

<!-- Update button -->
<button onclick="Cal('modal', 'your-username/30min')">Schedule a Call</button>
```

---

## 3. Live Homelab Stats

### Architecture

```
Your Homelab Server
    ↓
Python script (cron every 15 min)
    ↓
homelab-stats.json
    ↓
Served via: GitHub Pages / Cloudflare Pages / Direct from Homelab
    ↓
Portfolio website fetches and displays
```

### Setup Steps

1. **Configure the Python Script**
   - Copy `collect-homelab-stats.py` to your homelab server
   - Edit the `CONFIG` section:
     ```python
     CONFIG = {
       'output_path': '/var/www/html/homelab-stats.json',
       'services': [
         {'name': 'Prometheus', 'container': 'prometheus'},
         # ... your services
       ],
       'storage_paths': ['/mnt/data'],
     }
     ```

2. **Install Dependencies**
   ```bash
   pip install requests
   ```

3. **Test the Script**
   ```bash
   python3 collect-homelab-stats.py
   ```
   
   Check that `homelab-stats.json` was created with your stats.

4. **Set Up Cron Job**
   ```bash
   crontab -e
   ```
   Add:
   ```
   */15 * * * * /usr/bin/python3 /path/to/collect-homelab-stats.py
   ```

5. **Serve the JSON File**
   
   **Option A: Direct from Homelab (via Nginx)**
   ```nginx
   location /homelab-stats.json {
     alias /var/www/html/homelab-stats.json;
     add_header Access-Control-Allow-Origin *;
     add_header Cache-Control "no-cache";
   }
   ```

   **Option B: GitHub Pages**
   - Push `homelab-stats.json` to your GitHub Pages repo
   - Access via `https://username.github.io/repo/homelab-stats.json`

   **Option C: Same origin as portfolio**
   - Just place the file in your website directory

6. **Update Your Website**
   - Open `index.html`
   - Find `HOMELAB_STATS_CONFIG` in the JavaScript
   - Set `statsUrl` to your JSON endpoint:
     ```javascript
     const HOMELAB_STATS_CONFIG = {
       statsUrl: 'https://stats.yourdomain.com/homelab-stats.json',
       refreshInterval: 300000, // 5 minutes
     };
     ```

### JSON Format

Your `homelab-stats.json` should follow this structure:

```json
{
  "timestamp": "2025-01-27T15:30:00Z",
  "uptime": {
    "percentage": 99.7
  },
  "security": {
    "attacks_blocked_24h": 2847
  },
  "containers": {
    "running": 24
  },
  "storage": {
    "total_tb": 6
  },
  "services": [
    {"name": "Prometheus", "status": "healthy"},
    {"name": "Grafana", "status": "healthy"}
  ]
}
```

---

## Files Included

| File | Description |
|------|-------------|
| `index.html` | Main portfolio page with all integrations |
| `skeuomorphic-design-system.css` | Styling system |
| `contact-form-backend.gs` | Google Apps Script for contact form |
| `collect-homelab-stats.py` | Python script for homelab metrics |
| `homelab-stats.json` | Sample stats JSON structure |

---

## Troubleshooting

### Contact Form Not Working

1. Check browser console for errors
2. Verify Apps Script URL is correct
3. Make sure Apps Script is deployed as "Anyone" access
4. Test the Apps Script directly via the test function

### Cal.com Link Not Working

1. Verify your Cal.com username is correct
2. Make sure you have at least one event type created
3. Check that your calendar is connected

### Live Stats Not Updating

1. Check browser console for fetch errors
2. Verify JSON URL is accessible (try in browser)
3. Check CORS headers on your server
4. Verify JSON format is valid

---

## Security Notes

- The Google Apps Script runs under your account - only deploy to "Anyone" for the contact form
- The homelab stats JSON should only contain public info (no passwords, IPs, etc.)
- Use Cloudflare or similar for DDoS protection on public endpoints

---

## Questions?

Open an issue on GitHub or reach out via the contact form! 🚀
