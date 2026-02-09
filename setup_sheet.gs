/**
 * Fleet Monitor Sheet Initializer v3 (Table Compatible)
 * This script configures the Google Sheet for the Leader A1 app.
 * - Fixes "Typed Column" errors
 * - Corrects alignment for ELD, Duty, Follow Up, and Board
 * - Handles Google Sheets "Tables" feature
 */
function setupFleetMonitorSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets()[0];
  
  // 1. Define Headers exactly as the app expects (A-K)
  const headers = [
    "Name", "Email", "ELD Status", "Duty Status", "Follow Up", 
    "Company", "Board", "Device Type", "App Version", 
    "Last Sent At", "Email Sent"
  ];
  
  // Set headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Formatting
  sheet.getRange(1, 1, 1, headers.length)
       .setFontWeight("bold")
       .setBackground("#1e4d3a")
       .setFontColor("white");
  
  sheet.setFrozenRows(1);

  // 2. CRITICAL: Handle "Tables" feature and Clear Validations
  // If the sheet is already a "Table", we might need to be careful.
  try {
    // Clear all existing validations to prevent "typed column" conflicts
    sheet.getRange("A:K").clearDataValidations();
  } catch (e) {
    Logger.log("Warning clearing validations: " + e.message);
  }

  // 3. Set up Data Validation (Dropdowns) with CORRECT INDICES
  function setValidation(col, values) {
    var range = sheet.getRange(2, col, 1999, 1);
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(values)
      .setAllowInvalid(false)
      .build();
    
    try {
      range.setDataValidation(rule);
    } catch (e) {
      Logger.log("Could not set validation for col " + col + ": " + e.message);
      // If it's a typed column, the error "This operation is not allowed on cells in typed columns"
      // means the user should manually set the column type to "Dropdown" or "Text" first.
    }
  }

  // Column Mapping:
  // A (1): Name
  // B (2): Email
  // C (3): ELD Status
  // D (4): Duty Status
  // E (5): Follow Up
  // F (6): Company
  // G (7): Board
  // H (8): Device Type
  // I (9): App Version
  // J (10): Last Sent At
  // K (11): Email Sent

  setValidation(3, ["Connected", "Disconnected"]);
  setValidation(4, ["Driving", "On Duty", "Off Duty", "Sleep", "Not Set"]);
  setValidation(5, ["Action required", "Connect", "None"]);
  setValidation(7, ["Board A", "Board B", "Board C"]);
  setValidation(11, ["TRUE", "FALSE"]);

  // 4. Force Table range update if it's a Google Table
  try {
    var tables = sheet.getTables();
    if (tables && tables.length > 0) {
      var table = tables[0];
      var lastRow = Math.max(sheet.getLastRow(), 2);
      table.setRange(sheet.getRange(1, 1, lastRow, 11));
    }
  } catch (e) {
    Logger.log("Table API skip: " + e.message);
  }

  sheet.autoResizeColumns(1, 11);
  
  SpreadsheetApp.getUi().alert("Sheet Layout Configured!\n\nIf you see 'Typed Column' errors, please ensure these columns are set to 'Text' type or 'Dropdown' type in the Table menu.");
}
