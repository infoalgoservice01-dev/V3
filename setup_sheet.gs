/**
 * Fleet Monitor Sheet Initializer v2
 * This script configures the Google Sheet to work perfectly with the Leader A1 app.
 * - Fixes column misalignment
 * - Adds specific dropdowns for Board A/B/C
 * - Ensures correct Duty Status options
 * - Expands table to Column K
 * - DOES NOT DELETE EXISTING DRIVER NAMES/EMAILS
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
  
  // Set headers and format
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
       .setFontWeight("bold")
       .setBackground("#1e4d3a") // Dark green to match screenshot
       .setFontColor("white")
       .setVerticalAlignment("middle");
  
  sheet.setFrozenRows(1);

  // 2. Clear OLD validations to fix misalignment
  // This clears ghost dropdowns from previous attempts
  sheet.getRange("A:K").clearDataValidations();

  // 3. Set up Data Validation (Dropdowns)
  
  /** Helper to set dropdowns */
  function setValidation(col, values) {
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(values)
      .setAllowInvalid(false)
      .build();
    // Apply to rows 2 through 2000
    sheet.getRange(2, col, 1999, 1).setDataValidation(rule);
  }

  // Col C (3): ELD Status
  setValidation(3, ["Connected", "Disconnected"]);
  
  // Col D (4): Duty Status
  setValidation(4, ["Driving", "On Duty", "Off Duty", "Sleep", "Not Set"]);
  
  // Col E (5): Follow Up
  setValidation(5, ["Action required", "Connect", "None"]);
  
  // Col G (7): Board
  setValidation(7, ["Board A", "Board B", "Board C"]);
  
  // Col K (11): Email Sent
  setValidation(11, ["TRUE", "FALSE"]);

  // 4. Force Table Expansion (for Google Tables)
  // In the new Sheets UI, "Tables" are independent objects.
  try {
    const tables = sheet.getTables();
    if (tables.length > 0) {
      const table = tables[0];
      // Resize table to cover all 11 columns and existing rows
      const lastRow = Math.max(sheet.getLastRow(), 15); 
      const newRange = sheet.getRange(1, 1, lastRow, headers.length);
      table.setRange(newRange);
    }
  } catch (e) {
    console.log("Note: Not using the 'Table' object feature or API not available.");
  }

  // 5. Cleanup
  sheet.autoResizeColumns(1, headers.length);
  
  // Final styling for the header row
  sheet.getRange(1, 1, 1, headers.length).setBorder(true, true, true, true, true, true, "white", SpreadsheetApp.BorderStyle.SOLID);

  SpreadsheetApp.getUi().alert("Sheet Layout Fixed!\n\nIndices:\nC: ELD\nD: Duty\nE: FollowUp\nG: Board\nK: EmailSent");
}
