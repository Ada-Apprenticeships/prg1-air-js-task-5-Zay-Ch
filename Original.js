const fs = require('fs');

function readCsv(filename, delimiter = ',') {
    try {
        const fileContent = fs.readFileSync(filename, { encoding: 'utf-8' });
        const rows = fileContent.split('\n');
        const data = [];

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i].trim();
            if (row) {
                const columns = row.split(delimiter);
                data.push(columns);
            }
        }

        return data;
    } catch (err) {
        console.error("Error reading file:", err.message);
        return null;
    }
}

// Usage example
const airportsData = readCsv('airports.csv');
if (airportsData) {
    airportsData.forEach(row => {
        console.log(row);
    });
}
