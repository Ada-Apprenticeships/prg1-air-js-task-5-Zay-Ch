const fs = require('fs');
const csvParse = require('sync-csv');

// Helper function to parse CSV files synchronously
function parseCSV(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return csvParse(fileContent, {
        columns: true,
        skip_empty_lines: true,
    });
}

// Helper function to write results to a text file
function writeResultsToFile(results) {
    const output = results.join('\n');
    fs.writeFileSync('flight_results.txt', output);
}