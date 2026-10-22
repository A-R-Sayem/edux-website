# EduX Website

Modern coaching-centre website for **EduX** (Bahubal, Habiganj) with a working enrollment form that saves to a private **Google Sheet** through **Google Apps Script**.

Plain HTML + CSS + JavaScript. No build step, no Node, no frameworks. If you can edit a text file, you can maintain this.

---

## 1. What is in the box

```text
EduX/
├── index.html              Home (hero, why EduX, courses, founders, philosophy, CTA, contact)
├── pages/
│   ├── about.html          About us
│   ├── courses.html        All programs
│   └── enroll.html         Enrollment form
├── css/
│   ├── style.css           Design tokens (colours) + all components
│   └── responsive.css      Tablet / laptop adjustments
├── js/
│   ├── config.js           ★ THE FILE YOU EDIT: contact, courses, founders, endpoint
│   ├── main.js             Draws header, footer, courses, founders from config.js
│   └── enrollment.js       Form validation + sending to Google
├── assets/
│   ├── images/             founder-*.jpg (cropped from your posters), edux-brand-overview.jpg
│   └── icons/favicon.svg
├── backend/                Google Apps Script (copied into Google, NOT hosted on GitHub Pages)
│   ├── Code.gs
│   ├── appsscript.json
│   └── README.md           Backend setup guide
└── README.md               (this file)
```

**Architecture in one picture**

```text
Visitor's phone ──► GitHub Pages (static site)
        │ fills form (validated in browser)
        ▼
 POST  text/plain JSON ──► Apps Script Web App (/exec)
                              │ validates AGAIN, throttles, locks
                              ▼
                       Google Sheet "Enrollments"  (private, founders only)
```

The website never sees the spreadsheet. The only thing public is the web-app URL, which can only *add* rows.

## 2. Assets: what was used

| Upload | Used as |
|---|---|
| Group graphic ("Education, reimagined.") | `assets/images/edux-brand-overview.jpg`, used only for social-sharing previews (not as a background) |
| Jihad / Sanim / Sayem posters | Portraits cropped from each poster's circle → `founder-jihad.jpg`, `founder-sanim.jpg`, `founder-sayem.jpg` |
| Logo | **No separate logo file was in the upload.** The wordmark is rebuilt as text ("Edu" white + "X" blue) and a favicon was made from it. To use a real logo: drop it in `assets/images/` and set `brand.logoImage` in `js/config.js`. |

## 3. Run it on your computer

Double-clicking `index.html` works for looking around. To test the form properly, serve the folder:

```bash
cd EduX
python3 -m http.server 8000
# open http://localhost:8000
```

## 4. Everyday edits (all in `js/config.js`)

| I want to… | Change |
|---|---|
| Add phone / WhatsApp / email | `contact.phone`, `contact.whatsapp`, `contact.email` |
| Add Facebook / YouTube etc. | `social.facebook` … (full `https://` URLs) |
| Set an exact map pin | `contact.mapUrl` (Google Maps → Share → Copy link). The current link is only a *search*, not a verified pin |
| Add subjects | `classes[].subjects: ['Mathematics', 'Physics']` |
| Add batches | `classes[].batches: [{ value: 'morning', label: 'Morning (8–10 AM)' }]` |
| Show a fee / schedule | `classes[].fee`, `classes[].schedule` (`null` shows "Contact us for details") |
| Turn on Class 6/7/8 | set `enabled: true` on that class |
| Add an instructor | copy a block in `founders`, add the photo to `assets/images/` |
| Change colours | `:root { … }` at the top of `css/style.css` |

### Keeping the website and backend in sync
The website decides what the form *shows*; the backend decides what it *accepts*. Class names, subjects and batches therefore exist in two places: `js/config.js` and `CONFIG.OPTIONS` at the top of `backend/Code.gs`. When you add a subject/batch/class, **change both**, then re-deploy the backend (see backend README, "Updating"). If they disagree, the server rejects the request with a "choose a valid…" message. That is deliberate: it keeps the browser from being trusted.

## 5. Deploy: step by step

1. **Create the backend first** → follow `backend/README.md` (Sheet → Apps Script → Web app). You get a URL ending in `/exec`.
2. **Connect the website:** open `js/config.js`, paste the URL into `enrollment.endpoint`.
3. **Publish on GitHub Pages**
   1. Create a GitHub repository (e.g. `edux-website`). Do **not** put the `backend/` secrets anywhere; there are none in it, but you may leave the folder out of the public repo if you prefer.
   2. Upload all files (keep the folder structure; `index.html` at the top).
   3. Repository → **Settings → Pages** → Source: *Deploy from a branch* → Branch `main`, folder `/ (root)` → Save.
   4. After a minute the site is live at `https://YOUR-NAME.github.io/edux-website/`.
4. **Social-sharing previews:** in each page's `<head>`, change `og:image` to the full address, e.g. `https://YOUR-NAME.github.io/edux-website/assets/images/edux-brand-overview.jpg` (and optionally add `og:url`).
5. Do the **test checklist** below on the live site.

## 6. Why `text/plain`? (the browser ↔ Apps Script detail)

Browsers normally send a "pre-flight" `OPTIONS` request before a cross-origin `fetch` with a JSON content type, and Apps Script cannot answer it, so the request fails. Sending the JSON as `Content-Type: text/plain` makes it a CORS "simple request", so no pre-flight happens. Google's `/exec` response is then readable by the page, so the site can show a *real* success or error instead of guessing.

Trade-offs, honestly:
- It relies on the web app being deployed with **Who has access: Anyone** (no Google sign-in). If it isn't, Google returns a sign-in HTML page; the site detects that and shows a friendly error (and logs a hint in the browser console).
- Apps Script cannot read the visitor's IP address, so abuse control is by phone number and total volume, not IP (see backend README).
- If a reply is lost after the row was saved (network drops at the wrong moment), each form attempt carries a random token. Retrying with the same token **returns the original reference ID instead of creating a second row**.

## 7. What was verified, and what was not

Verified here, by automated tests:
- **Backend logic (`Code.gs`)**, 22 checks against an in-memory simulation of Google's services: validation, class/subject/batch allow-lists, server-made ID/status/time, duplicate-token handling, per-phone and global throttling, honeypot, formula-injection neutralising, lock-busy handling, no internal details in errors, sheet setup being re-runnable.
- **Website in real Chromium**, 46 checks: no horizontal overflow at 390/768/1280 px, hamburger menu, all links and anchors resolve, images load, no console errors, reduced-motion, form validation and Bangladesh phone formats, double-click sends one request, success/failed/validation/rate-limit/wrong-deployment responses, entered data kept after a failed send, retry token reuse, draft restore, honeypot.

**Not verified: the live Google part.** Nothing could be deployed to *your* Google account from here, so these have not been run against real Google Sheets/Apps Script: the real `/exec` round-trip from the live site, and the visual result of `setupEnrollmentSheet()` (filters, colours, dropdown). That is exactly what the checklist in section 8 is for; it takes about 10 minutes.

## 8. Test checklist (run after deploying)

**Backend (before connecting the site)**
- [ ] Run `setupEnrollmentSheet()` → tab "Enrollments" appears with blue header, frozen row, filter, Status dropdown.
- [ ] Run `testSubmission()` → one `TEST Student` row, Status `Pending`, ID like `EDX-20261010-AB3K7Q`. Delete it.
- [ ] Open the `/exec` URL in a browser → you see only `{"ok":true,"service":"EduX enrollment",…}`.

**Valid submission (live site)**
- [ ] Fill every field, tick consent, submit → "Thank you for choosing EduX!" with a reference ID.
- [ ] A new row appears within seconds; name/phones/class correct; phones keep their leading `0`; Status = Pending.
- [ ] Try `+8801XXXXXXXXX` for a phone → stored as `01XXXXXXXXX`.

**Invalid fields**
- [ ] Submit empty → red messages, cursor jumps to first problem, nothing is sent.
- [ ] Phone `12345`, `01212345678` (bad operator digit) → rejected.
- [ ] Untick consent → rejected.

**Network failure**
- [ ] On a phone, turn on airplane mode, submit → friendly "could not reach the server" message and **your typed data is still there**.
- [ ] Turn network back on, press Submit again → success, and only **one** row exists.

**Duplicate clicks**
- [ ] Double-tap Submit quickly → button shows "Sending…" and only one row is created.

**Abuse controls**
- [ ] Submit the same student phone 4 times within an hour → 4th is refused with a "several requests recently" message.

**Mobile**
- [ ] On a real Android phone: no sideways scrolling, hamburger opens/closes, buttons are easy to tap, form fields don't zoom the page, founders' photos are sharp.
- [ ] Every menu item goes to the right place.

**Spreadsheet**
- [ ] Change a Status with the dropdown → cell colour changes.
- [ ] Submit a message starting with `=1+1` → the cell shows it as text (with a leading `'`), not `2`.
- [ ] The sheet is **not** shared publicly (Share → General access: Restricted).

## 9. Troubleshooting

| Symptom | Likely cause → fix |
|---|---|
| "Online enrollment is not available just yet" | `enrollment.endpoint` is still empty in `js/config.js` |
| "The enrollment service sent an unexpected reply" | Web app access isn't **Anyone**. Deploy → Manage deployments → edit → *Who has access: Anyone* → new version |
| "We could not reach the server" on every try | Wrong/old URL (must end `/exec`, not `/dev`); or you forgot to redeploy after editing `Code.gs`; or the visitor is offline |
| Opening the `/exec` URL asks to sign in | Same as the "unexpected reply" row |
| Server says "choose a valid class/subject/batch" | `js/config.js` and `CONFIG.OPTIONS` in `Code.gs` differ, or you changed `Code.gs` but didn't create a **new version** when redeploying |
| Rows land in row 1 / no header | Run `setupEnrollmentSheet()` (the backend also does this automatically on first use) |
| "No spreadsheet…" in Executions log | Script wasn't created from inside the Sheet. Open the Sheet → Extensions → Apps Script, or set the `SPREADSHEET_ID` script property |
| Phone number lost its leading 0 | The column's format was changed from plain text; run `setupEnrollmentSheet()` again |
| Changes to the site don't appear | GitHub Pages caches ~1–10 minutes; hard-refresh (Ctrl/Cmd+Shift+R) |
| Images missing on GitHub Pages | File names are case-sensitive (`founder-sayem.jpg`), and folders must be uploaded with the structure intact |
| Fonts look different | Google Fonts blocked/slow: the site falls back to the system font by design |

## 10. Not included (on purpose)

Payments, student accounts/passwords, online exams, and an admin dashboard. Founders manage requests directly in the private Sheet. Fees, schedules, subject lists, batches, phone/email and social links are **left blank on purpose** because they were not provided; the site shows "Contact us for details" instead of inventing them.
