# RSVP → Google Sheet setup

About 10 minutes, done once.

1. **Create the sheet.** Go to https://sheets.new and name it `Lily 6th · RSVPs`.
2. **Open Apps Script.** In the sheet: *Extensions → Apps Script*.
3. **Paste the code.** Delete what's in `Code.gs` and paste everything from `apps-script/Code.gs` in this repo. Click 💾 Save.
4. **Run setup once.** In the function dropdown at the top pick `setup`, then click ▶ Run.
   Google asks for permission: *Review permissions* → choose your account → *Advanced* → *Go to (project name)* → *Allow*.
   Back in the sheet you'll see two tabs: **RSVPs** and **Summary**.
5. **Deploy as a web app.** *Deploy → New deployment* → gear icon → *Web app*.
   - Description: `RSVP`
   - Execute as: **Me**
   - Who has access: **Anyone**
   Click *Deploy* and copy the **Web app URL** (it ends in `/exec`).
6. **Connect the site.** Paste that URL into `RSVP_URL` at the top of `script.js` (or send it to Claude).

## Changing the script later
Edit the code, then *Deploy → Manage deployments* → pencil icon → *Version: New version* → *Deploy*.
The URL stays the same.

## Notes
- Guests don't need a Google account.
- If a family replies twice, both rows are kept. Delete the older one so the Summary totals stay right.
- The web-app URL is visible in the site's code. The script only accepts RSVPs and ignores bot entries.
