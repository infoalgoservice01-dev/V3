/**
 * Fleet Monitor Sheet Initializer
 * This script configures the Google Sheet to work perfectly with the Leader A1 app.
 * 1. Sets Headers (Column A-K)
 * 2. Adds Data Validation (Dropdowns) for Statuses
 * 3. Populates Initial Data
 */
function setupFleetMonitorSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets()[0];
  sheet.setName("Drivers");

  // 1. Define Headers
  const headers = [
    "Name", "Email", "ELD Status", "Duty Status", "Follow Up", 
    "Company", "Board", "Device Type", "App Version", 
    "Last Sent At", "Email Sent"
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  sheet.setFrozenRows(1);

  // 2. Clear existing data (optional, but good for a fresh start)
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).clearContent();
  }

  // 3. Set up Data Validation (Dropdowns)
  
  // ELD Status (Col C)
  const eldRules = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Connected", "Disconnected"])
    .setAllowInvalid(false)
    .build();
  sheet.getRange("C2:C1000").setDataValidation(eldRules);

  // Duty Status (Col D)
  const dutyRules = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Driving", "On Duty", "Off Duty", "Sleep", "Not Set"])
    .setAllowInvalid(false)
    .build();
  sheet.getRange("D2:D1000").setDataValidation(dutyRules);

  // Follow Up Status (Col E)
  const followRules = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Action required", "Connect", "None"])
    .setAllowInvalid(false)
    .build();
  sheet.getRange("E2:E1000").setDataValidation(followRules);

  // Email Sent (Col K)
  const emailSentRules = SpreadsheetApp.newDataValidation()
    .requireValueInList(["TRUE", "FALSE"])
    .setAllowInvalid(false)
    .build();
  sheet.getRange("K2:K1000").setDataValidation(emailSentRules);

  // 4. Populate Initial Data
  const initialData = [
    ["John Miller", "john.m@trucking-co.com", "Connected", "Driving", "None", "Alpha Logistics", "Board A", "Samsung Tab A8", "v4.2.1", "", "FALSE"],
    ["Sarah Jenkins", "s.jenkins@trucking-co.com", "Disconnected", "Off Duty", "Action required", "Global Freight", "Board B", "iPad Mini 6", "v4.1.9", "2023-10-27T08:30:00Z", "TRUE"],
    ["Robert Davis", "r.davis@trucking-co.com", "Connected", "On Duty", "None", "Alpha Logistics", "Board A", "Android Tablet", "v4.2.0", "", "FALSE"],
    ["Michael Chen", "m.chen@trucking-co.com", "Connected", "Sleep", "None", "Rapid Trans", "Board C", "Samsung Tab S7", "v4.2.1", "", "FALSE"],
    ["Linda Thompson", "l.thompson@trucking-co.com", "Disconnected", "Driving", "Action required", "Global Freight", "Board B", "iPad Air", "v3.8.5", "2023-10-27T09:15:00Z", "TRUE"],
    ["Kevon Wright", "k.wright@trucking-co.com", "Connected", "On Duty", "None", "Alpha Logistics", "Board C", "Lenovo Tab P11", "v4.0.0", "", "FALSE"]
  ];

  sheet.getRange(2, 1, initialData.length, initialData[0].length).setValues(initialData);

  // 5. Cleanup
  sheet.autoResizeColumns(1, headers.length);
  SpreadsheetApp.getUi().alert("Sheet successfully configured for Leader A1!");
}
