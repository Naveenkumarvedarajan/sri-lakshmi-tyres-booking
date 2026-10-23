/*
 * Sri Lakshmi Tyres — Staff-Approved Booking System
 * Setup:
 * 1. Create/open a Google Sheet for bookings.
 * 2. Extensions > Apps Script. Paste this entire file into Code.gs.
 * 3. Set SHOP_WHATSAPP_NUMBER and STAFF_PIN below.
 * 4. Run setup() once and authorize permissions.
 * 5. Deploy > New deployment > Web app:
 *    Execute as: Me
 *    Who has access: Anyone
 * 6. Copy the /exec URL into index.html and staff.html.
 *
 * Note: PIN-based staff panel is a simple convenience gate, not enterprise-grade auth.
 * Restrict access to the staff URL and use a strong PIN. For sensitive deployments,
 * use Google Workspace sign-in or a proper authenticated backend.
 */

const CONFIG = {
  SPREADSHEET_ID: "", // Optional: paste spreadsheet ID. Blank = create/use sheet bound to this script.
  SHEET_NAME: "Bookings",
  SHOP_NAME: "Sri Lakshmi Tyres",
  SHOP_PHONE: "8668199063",
  SHOP_WHATSAPP_NUMBER: "918668199063",
  STAFF_PIN: "CHANGE_THIS_PIN", // CHANGE THIS before deployment.
  TIMEZONE: "Asia/Kolkata"
};

function setup() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  const headers = [
    "Booking ID","Created At","Customer Name","Customer Phone","Vehicle Type","Vehicle Model",
    "Registration","Tyre Size","Preferred Date","Preferred Time","Services","Notes",
    "Status","Staff Note","Updated At","Confirmation Sent At","Source"
  ];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,headers.length).setFontWeight("bold").setBackground("#08254a").setFontColor("#ffffff");
    sheet.autoResizeColumns(1, headers.length);
  }
  return {spreadsheetUrl:ss.getUrl(),sheetName:CONFIG.SHEET_NAME};
}

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : "";
  if (action === "health") return json_({success:true,service:"Sri Lakshmi Tyres booking API"});
  return json_({success:true,message:"Sri Lakshmi Tyres booking API is running."});
}

function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const action = String(data.action || "createBooking");
    if (action === "createBooking") return json_(createBooking_(data));
    if (action === "staffList") return json_(staffList_(data));
    if (action === "staffUpdate") return json_(staffUpdate_(data));
    return json_({success:false,message:"Unknown action."});
  } catch (err) {
    return json_({success:false,message:err.message || "Unexpected server error."});
  }
}

function createBooking_(d) {
  const required = ["name","phone","vehicle","model","date","time"];
  required.forEach(k => { if (!String(d[k] || "").trim()) throw new Error("Missing required field: " + k); });
  if (!String(d.services || "").trim()) throw new Error("Please select at least one service.");
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_();
    const id = "SLT-" + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd-HHmmss") + "-" + Math.floor(100 + Math.random()*900);
    const now = new Date();
    sheet.appendRow([
      id, now, clean_(d.name), clean_(d.phone), clean_(d.vehicle), clean_(d.model),
      clean_(d.registration), clean_(d.tyreSize), clean_(d.date), clean_(d.time),
      clean_(d.services), clean_(d.notes), "PENDING", "", now, "", clean_(d.source || "Website")
    ]);
    return {success:true,bookingId:id,status:"PENDING",message:"Booking request saved."};
  } finally {
    lock.releaseLock();
  }
}

function staffList_(d) {
  requirePin_(d.pin);
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return {success:true,bookings:[]};
  const headers = values[0];
  const bookings = values.slice(1).map((r,i) => {
    const obj = {rowNumber:i+2};
    headers.forEach((h,j) => obj[h] = r[j] instanceof Date ? Utilities.formatDate(r[j],CONFIG.TIMEZONE,"yyyy-MM-dd HH:mm:ss") : String(r[j] == null ? "" : r[j]));
    return obj;
  }).reverse();
  return {success:true,bookings:bookings};
}

function staffUpdate_(d) {
  requirePin_(d.pin);
  const id = String(d.bookingId || "").trim();
  const status = String(d.status || "").toUpperCase();
  const allowed = ["CONFIRMED","REJECTED","RESCHEDULED","COMPLETED","CANCELLED"];
  if (!id) throw new Error("Booking ID is required.");
  if (allowed.indexOf(status) < 0) throw new Error("Invalid booking status.");
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idCol = headers.indexOf("Booking ID") + 1;
  const statusCol = headers.indexOf("Status") + 1;
  const noteCol = headers.indexOf("Staff Note") + 1;
  const updatedCol = headers.indexOf("Updated At") + 1;
  const dateCol = headers.indexOf("Preferred Date") + 1;
  const timeCol = headers.indexOf("Preferred Time") + 1;
  const confirmationCol = headers.indexOf("Confirmation Sent At") + 1;
  let row = -1;
  for (let i=1;i<values.length;i++) if (String(values[i][idCol-1]) === id) {row=i+1;break;}
  if (row < 0) throw new Error("Booking not found.");
  sheet.getRange(row,statusCol).setValue(status);
  sheet.getRange(row,noteCol).setValue(clean_(d.staffNote || ""));
  sheet.getRange(row,updatedCol).setValue(new Date());
  if (d.date) sheet.getRange(row,dateCol).setValue(clean_(d.date));
  if (d.time) sheet.getRange(row,timeCol).setValue(clean_(d.time));
  if (d.confirmationSent) sheet.getRange(row,confirmationCol).setValue(new Date());
  const record = sheet.getRange(row,1,1,headers.length).getValues()[0];
  const out = {};
  headers.forEach((h,j)=>out[h]=record[j] instanceof Date?Utilities.formatDate(record[j],CONFIG.TIMEZONE,"yyyy-MM-dd HH:mm:ss"):String(record[j] == null ? "" : record[j]));
  return {success:true,booking:out,message:"Booking updated."};
}

function requirePin_(pin) {
  if (!pin || String(pin) !== String(CONFIG.STAFF_PIN) || CONFIG.STAFF_PIN === "CHANGE_THIS_PIN") {
    throw new Error("Staff PIN is incorrect or has not been configured. Update STAFF_PIN in Code.gs and redeploy.");
  }
}

function getSpreadsheet_() {
  if (CONFIG.SPREADSHEET_ID) return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty("SPREADSHEET_ID");
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (e) {}
  }
  const ss = SpreadsheetApp.create("Sri Lakshmi Tyres Bookings");
  props.setProperty("SPREADSHEET_ID", ss.getId());
  return ss;
}
function getSheet_() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) { setup(); sheet = ss.getSheetByName(CONFIG.SHEET_NAME); }
  return sheet;
}
function clean_(v) {
  const s = String(v == null ? "" : v).trim();
  // Prevent spreadsheet formula injection from customer-entered values.
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
