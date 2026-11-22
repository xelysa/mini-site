/**
 * RSVP receiver for Lily's 6th birthday site.
 *
 * This file is NOT run by the website. It lives here for reference.
 * Paste it into Extensions → Apps Script of the Google Sheet, run setup() once,
 * then deploy as a web app (see apps-script/README.md).
 */

const SHEET_NAME = 'RSVPs';
const HEADERS = ['Timestamp', 'Child(ren)', 'Coming', 'Kids', 'Adults', 'Names', 'Allergies / notes'];

/** Run once from the Apps Script editor: creates the RSVPs and Summary tabs. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME, 0);
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.getRange('A:A').setNumberFormat('dd/mm hh:mm');

  let summary = ss.getSheetByName('Summary');
  if (!summary) summary = ss.insertSheet('Summary', 1);
  summary.getRange('A1:B5').setValues([
    ['Replies', '=COUNTA(RSVPs!B2:B)'],
    ['Coming (families)', '=COUNTIF(RSVPs!C2:C,"Yes")'],
    ['Not coming', '=COUNTIF(RSVPs!C2:C,"No")'],
    ['Children', '=SUMIF(RSVPs!C2:C,"Yes",RSVPs!D2:D)'],
    ['Adults', '=SUMIF(RSVPs!C2:C,"Yes",RSVPs!E2:E)'],
  ]);
  summary.getRange('A1:A5').setFontWeight('bold');
  summary.getRange('A7').setValue('If a family replies twice, delete their older row so the totals stay right.');
}

/** Receives the form from the website. */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const p = (e && e.parameter) || {};

    // Honeypot: real people never fill this field
    if (p.website) return json({ ok: true });

    const child = text(p.child, 150);
    const coming = p.coming === 'yes' ? 'Yes' : p.coming === 'no' ? 'No' : '';
    if (!child || !coming) return json({ ok: false, error: 'missing' });

    const yes = coming === 'Yes';
    const row = [
      new Date(),
      child,
      coming,
      yes ? count(p.kids, 6) : 0,
      yes ? count(p.adults, 4) : 0,
      yes ? text(p.names, 300) : '',
      text(p.notes, 1000),
    ];

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    sheet.appendRow(row);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: 'server' });
  } finally {
    lock.releaseLock();
  }
}

/** Lets you open the web-app URL in a browser to check it is live. */
function doGet() {
  return json({ ok: true, message: 'RSVP endpoint is running' });
}

function text(value, max) {
  let s = String(value || '').trim().slice(0, max);
  // Stop text being treated as a spreadsheet formula
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function count(value, max) {
  const n = parseInt(value, 10);
  return isNaN(n) ? 0 : Math.max(0, Math.min(max, n));
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
