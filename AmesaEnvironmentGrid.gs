/**
 * AmesaBase Environment URLs Grid Generator
 * Google Apps Script to create environment reference grid in Google Sheets
 */

function createAmesaEnvironmentGrid() {
  // Get the active spreadsheet or create a new one
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getActiveSheet();
  
  // Clear existing content
  sheet.clear();
  
  // Set sheet name
  sheet.setName('AmesaBase Environments');
  
  // Define headers
  const headers = [
    'Environment',
    'Frontend URL', 
    'Backend API',
    'CloudFront ID',
    'S3 Bucket',
    'ALB Name',
    'Database Cluster',
    'Health Check',
    'Houses API',
    'Translations API'
  ];
  
  // Define environment data
  const environmentData = [
    [
      'Development',
      'https://d2rmamd755wq7j.cloudfront.net',
      'amesa-backend-stage-alb-467028641.eu-north-1.elb.amazonaws.com',
      'E2XBDFAUZJTI59',
      'amesa-frontend-dev',
      'amesa-backend-stage-alb',
      'amesadbmain-stage',
      'https://d2rmamd755wq7j.cloudfront.net/health',
      'https://d2rmamd755wq7j.cloudfront.net/api/v1/houses',
      'https://d2rmamd755wq7j.cloudfront.net/api/v1/translations/en'
    ],
    [
      'Staging',
      'https://d2ejqzjfslo5hs.cloudfront.net',
      'amesa-backend-stage-alb-467028641.eu-north-1.elb.amazonaws.com',
      'E1D7XQHFF1469W',
      'amesa-frontend-stage',
      'amesa-backend-stage-alb',
      'amesadbmain-stage',
      'https://d2ejqzjfslo5hs.cloudfront.net/health',
      'https://d2ejqzjfslo5hs.cloudfront.net/api/v1/houses',
      'https://d2ejqzjfslo5hs.cloudfront.net/api/v1/translations/en'
    ],
    [
      'Production',
      'https://dpqbvdgnenckf.cloudfront.net',
      'amesa-backend-alb-509078867.eu-north-1.elb.amazonaws.com',
      'E3GU3QXUR43ZOH',
      'amesa-frontend-prod',
      'amesa-backend-alb',
      'amesadbmain',
      'https://dpqbvdgnenckf.cloudfront.net/health',
      'https://dpqbvdgnenckf.cloudfront.net/api/v1/houses',
      'https://dpqbvdgnenckf.cloudfront.net/api/v1/translations/en'
    ]
  ];
  
  // Write headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Write data
  sheet.getRange(2, 1, environmentData.length, headers.length).setValues(environmentData);
  
  // Format the sheet
  formatSheet(sheet, headers.length);
  
  // Log completion
  console.log('AmesaBase Environment Grid created successfully!');
  SpreadsheetApp.getUi().alert('AmesaBase Environment Grid created successfully!');
}

function formatSheet(sheet, numColumns) {
  // Format headers
  const headerRange = sheet.getRange(1, 1, 1, numColumns);
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, numColumns);
  
  // Add borders
  const dataRange = sheet.getDataRange();
  dataRange.setBorder(true, true, true, true, true, true);
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Add alternating row colors
  const numRows = sheet.getLastRow();
  for (let i = 2; i <= numRows; i += 2) {
    sheet.getRange(i, 1, 1, numColumns).setBackground('#f8f9fa');
  }
  
  // Make URLs clickable
  makeUrlsClickable(sheet, numRows, numColumns);
}

function makeUrlsClickable(sheet, numRows, numColumns) {
  const data = sheet.getDataRange().getValues();
  
  for (let row = 2; row <= numRows; row++) {
    for (let col = 1; col <= numColumns; col++) {
      const cellValue = data[row - 1][col - 1];
      
      // Check if cell contains a URL
      if (typeof cellValue === 'string' && cellValue.startsWith('https://')) {
        const cell = sheet.getRange(row, col);
        cell.setFormula(`=HYPERLINK("${cellValue}", "${cellValue}")`);
      }
    }
  }
}

function createQuickAccessSheet() {
  // Create a second sheet for quick access links
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let quickAccessSheet;
  
  try {
    quickAccessSheet = spreadsheet.getSheetByName('Quick Access');
  } catch (e) {
    quickAccessSheet = spreadsheet.insertSheet('Quick Access');
  }
  
  quickAccessSheet.clear();
  
  // Quick access data
  const quickAccessData = [
    ['Environment', 'Frontend App', 'Health Check', 'Houses API', 'Translations API'],
    [
      'Development',
      'https://d2rmamd755wq7j.cloudfront.net',
      'https://d2rmamd755wq7j.cloudfront.net/health',
      'https://d2rmamd755wq7j.cloudfront.net/api/v1/houses',
      'https://d2rmamd755wq7j.cloudfront.net/api/v1/translations/en'
    ],
    [
      'Staging',
      'https://d2ejqzjfslo5hs.cloudfront.net',
      'https://d2ejqzjfslo5hs.cloudfront.net/health',
      'https://d2ejqzjfslo5hs.cloudfront.net/api/v1/houses',
      'https://d2ejqzjfslo5hs.cloudfront.net/api/v1/translations/en'
    ],
    [
      'Production',
      'https://dpqbvdgnenckf.cloudfront.net',
      'https://dpqbvdgnenckf.cloudfront.net/health',
      'https://dpqbvdgnenckf.cloudfront.net/api/v1/houses',
      'https://dpqbvdgnenckf.cloudfront.net/api/v1/translations/en'
    ]
  ];
  
  // Write data
  quickAccessSheet.getRange(1, 1, quickAccessData.length, quickAccessData[0].length)
    .setValues(quickAccessData);
  
  // Format quick access sheet
  const headerRange = quickAccessSheet.getRange(1, 1, 1, quickAccessData[0].length);
  headerRange.setBackground('#34a853');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  quickAccessSheet.autoResizeColumns(1, quickAccessData[0].length);
  quickAccessSheet.setFrozenRows(1);
  
  // Make URLs clickable
  makeUrlsClickable(quickAccessSheet, quickAccessData.length, quickAccessData[0].length);
}

function createCompleteGrid() {
  // Create both sheets
  createAmesaEnvironmentGrid();
  createQuickAccessSheet();
  
  console.log('Complete AmesaBase Environment Grid created with both sheets!');
}

// Menu function to add custom menu
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('AmesaBase')
    .addItem('Create Environment Grid', 'createAmesaEnvironmentGrid')
    .addItem('Create Quick Access Sheet', 'createQuickAccessSheet')
    .addItem('Create Complete Grid', 'createCompleteGrid')
    .addSeparator()
    .addItem('Refresh All Data', 'createCompleteGrid')
    .addToUi();
}
