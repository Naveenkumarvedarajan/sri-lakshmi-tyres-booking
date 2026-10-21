# Sri Lakshmi Tyres — Staff-Approved Booking System

## What this includes
- `index.html`: customer booking request page
- `staff.html`: staff panel to review requests, accept/reject/reschedule, and prepare WhatsApp messages to customers
- `Code.gs`: Google Apps Script backend and Google Sheets storage
- `sri-lakshmi-tyres-logo.png` and `sri-lakshmi-tyres-poster.png`: your branding assets (copy these into the same repository folder)

## How the booking flow works
1. Customer submits a request.
2. Apps Script saves it to the `Bookings` sheet with `PENDING` status and returns a booking ID.
3. Staff opens `staff.html`, enters the configured PIN, and reviews requests.
4. Staff accepts, suggests another slot, or rejects.
5. The panel updates the booking status and opens WhatsApp with a customer-specific message. Staff reviews and taps **Send**.
6. Status and staff notes remain in Google Sheets.

## Setup Google Sheets + Apps Script
1. Open https://script.google.com/ and create a new project.
2. Replace the contents of `Code.gs` with the provided `Code.gs` in this folder.
3. In `Code.gs`, change `STAFF_PIN` from `CHANGE_THIS_PIN` to a strong PIN. Keep the shop WhatsApp number as `918668199063` (country code included).
4. Click **Run** and select `setup`. Approve the requested Google permissions.
5. The setup function creates a spreadsheet named **Sri Lakshmi Tyres Bookings** and a `Bookings` tab. Open the execution log / returned result to find the spreadsheet URL. If you want to use an existing sheet, put its ID in `SPREADSHEET_ID` before running setup.
6. In Apps Script choose **Deploy → New deployment → Web app**.
7. Set **Execute as: Me** and **Who has access: Anyone** (required for public GitHub Pages requests). Deploy and authorize if prompted.
8. Copy the deployed URL ending in `/exec`.

## Connect the website
1. In both `index.html` and `staff.html`, replace `PASTE_YOUR_DEPLOYED_APPS_SCRIPT_WEB_APP_URL_HERE` with the deployed `/exec` URL.
2. Upload these files to the root of your GitHub repository:
   - `index.html`
   - `staff.html`
   - `sri-lakshmi-tyres-logo.png`
   - `sri-lakshmi-tyres-poster.png`
3. Commit the changes and open **GitHub → repository Settings → Pages**. Select deploy from `main` branch and `/(root)`.
4. Customer page: `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`
5. Staff panel: `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/staff.html`

## Test before sharing
1. Submit a sample booking using a phone number you control.
2. Confirm the request appears in the `Bookings` Google Sheet with `PENDING` status.
3. Open `staff.html`, sign in with your staff PIN, accept the booking.
4. Check that the row status becomes `CONFIRMED` and WhatsApp opens with a prefilled message.
5. Tap **Send** in WhatsApp and confirm the customer receives it.
6. Test reject and reschedule flows too.

## Important notes
- WhatsApp `wa.me` links prefill a message; they do not send automatically. Staff must tap Send. Fully automatic confirmations require the WhatsApp Business Platform/API and its approved setup.
- This starter panel uses a shared PIN. It is not strong identity-based authentication; keep the staff URL private, use a non-obvious PIN, and do not put secrets in public source files. Anyone who knows the URL and PIN can access the panel.
- Anyone with the deployed Apps Script endpoint can potentially submit a booking. Add stronger authentication/rate limiting before using it for sensitive or high-volume bookings.
- The browser must be online. Check the Apps Script execution logs if requests fail.
