const fs = require('fs');

// Function to read and parse a CSV file
function readCsv(filename, delimiter = ',') {
    try {
        const fileContent = fs.readFileSync(filename, { encoding: 'utf-8' });
        const rows = fileContent.split('\n').map(row => row.trim()).filter(row => row);
        const headers = rows[0].split(delimiter).map(header => header.trim());
        const data = rows.slice(1).map(row => {
            const values = row.split(delimiter).map(value => value.trim());
            return headers.reduce((acc, header, index) => {
                acc[header] = values[index];
                return acc;
            }, {});
        });
        return data;
    } catch (err) {
        console.error("Error reading file:", err.message);
        return null;
    }
}

// Helper function to write results to a text file
function writeResultsToFile(results, filename) {
    const output = results.join('\n');
    fs.writeFileSync(filename, output, { flag: 'w' }); // 'w' flag creates the file if it does not exist
}

// Function to calculate profit/loss for valid flights
function calculateValidFlights() {
    const airports = readCsv('airports.csv');
    const aeroplanes = readCsv('aeroplanes.csv');
    const validFlights = readCsv('valid_flight_data.csv');
    const results = [];

    console.log("Airports Data:", airports);
    console.log("Aeroplanes Data:", aeroplanes);
    console.log("Valid Flights Data:", validFlights);

    validFlights.forEach(flight => {
        const ukAirport = flight['UK airport'];
        const overseasAirportCode = flight['Overseas airport'];
        const aircraftType = flight['Type of aircraft'];
        const economySeats = parseInt(flight['Number of economy seats booked']);
        const businessSeats = parseInt(flight['Number of business seats booked']);
        const firstClassSeats = parseInt(flight['Number of first class seats booked']);
        const economyPrice = parseFloat(flight['Price of a economy class seat']);
        const businessPrice = parseFloat(flight['Price of a business class seat']);
        const firstClassPrice = parseFloat(flight['Price of a first class seat']);
        
        const airport = airports.find(a => a.code === overseasAirportCode);
        const aeroplane = aeroplanes.find(a => a.type === aircraftType);

        // Debugging output
        console.log(`Checking flight: ${ukAirport} to ${overseasAirportCode} with ${aircraftType}`);
        console.log(`Parsed Seats: Economy=${economySeats}, Business=${businessSeats}, First Class=${firstClassSeats}`);
        
        if (airport) {
            console.log(`Airport found: ${airport['full name']} at distance ${ukAirport === 'MAN' ? airport.distanceMAN : airport.distanceLGW}`);
        } else {
            console.log(`Airport not found: ${overseasAirportCode}`);
        }

        if (aeroplane) {
            console.log(`Aeroplane found: ${aircraftType} with max range ${aeroplane['maxflightrange(km)']}`);
        } else {
            console.log(`Aeroplane not found: ${aircraftType}`);
        }

        if (airport && aeroplane) {
            const distance = ukAirport === 'MAN' ? parseInt(airport.distanceMAN) : parseInt(airport.distanceLGW);
            const maxRange = parseInt(aeroplane['maxflightrange(km)']);
            const totalSeats = economySeats + businessSeats + firstClassSeats;

            // Validate if the flight can proceed
            if (distance <= maxRange && totalSeats <= (parseInt(aeroplane.economyseats) + parseInt(aeroplane.businessseats) + parseInt(aeroplane.firstclassseats))) {
                const income = (economySeats * economyPrice) + (businessSeats * businessPrice) + (firstClassSeats * firstClassPrice);
                const costPerSeat = parseFloat(aeroplane.runningcostperseatper100km.replace('£', '')) * (distance / 100);
                const totalCost = costPerSeat * totalSeats;
                const profit = income - totalCost;

                const result = `Flight from ${ukAirport} to ${overseasAirportCode} with ${aircraftType}:\nIncome: £${income.toFixed(2)}, Cost: £${totalCost.toFixed(2)}, Profit: £${profit.toFixed(2)}`;
                results.push(result);
            } else {
                console.log(`Flight invalid: Distance exceeds max range or too many seats booked.`);
            }
        } else {
            console.log(`Flight validation failed: Invalid airport or aircraft type.`);
        }
    });

    if (results.length > 0) {
        writeResultsToFile(results, 'valid_flight_results.txt');
        results.forEach(result => console.log(result));
    } else {
        console.log("No valid flights processed.");
    }
}


// Function to handle invalid flights
function handleInvalidFlights() {
    const airports = readCsv('airports.csv');
    const aeroplanes = readCsv('aeroplanes.csv');
    const invalidFlights = readCsv('invalid_flight_data.csv');
    const results = [];

    invalidFlights.forEach(flight => {
        const ukAirport = flight['UK airport'];
        const overseasAirportCode = flight['Overseas airport'];
        const aircraftType = flight['Type of aircraft'];
        const economySeats = parseInt(flight['Number of economy seats booked']);
        const businessSeats = parseInt(flight['Number of business seats booked']);
        const firstClassSeats = parseInt(flight['Number of first class seats booked']);
        const economyPrice = parseFloat(flight['Price of a economy class seat']);
        const businessPrice = parseFloat(flight['Price of a business class seat']);
        const firstClassPrice = parseFloat(flight['Price of a first class seat']);

        const airport = airports.find(a => a.code === overseasAirportCode);
        const aeroplane = aeroplanes.find(a => a.type === aircraftType);

        let error = null;

        if (!airport) {
            error = `Invalid airport code: ${overseasAirportCode}`;
        } else if (!aeroplane) {
            error = `Invalid aircraft type: ${aircraftType}`;
        } else {
            const distance = ukAirport === 'MAN' ? parseInt(airport.distanceMAN) : parseInt(airport.distanceLGW);
            const maxRange = parseInt(aeroplane.maxflightrange);
            const totalSeats = economySeats + businessSeats + firstClassSeats;

            if (distance > maxRange) {
                error = `Aircraft ${aircraftType} doesn't have the range to fly to ${overseasAirportCode}`;
            } else if (economySeats > parseInt(aeroplane.economyseats)) {
                error = `Too many economy seats booked (${economySeats} > ${aeroplane.economyseats})`;
            } else if (businessSeats > parseInt(aeroplane.businessseats)) {
                error = `Too many business seats booked (${businessSeats} > ${aeroplane.businessseats})`;
            } else if (firstClassSeats > parseInt(aeroplane.firstclassseats)) {
                error = `Too many first-class seats booked (${firstClassSeats} > ${aeroplane.firstclassseats})`;
            } else if (totalSeats > (parseInt(aeroplane.economyseats) + parseInt(aeroplane.businessseats) + parseInt(aeroplane.firstclassseats))) {
                error = `Too many total seats booked (${totalSeats} > ${parseInt(aeroplane.economyseats) + parseInt(aeroplane.businessseats) + parseInt(aeroplane.firstclassseats)})`;
            }
        }

        if (error) {
            const result = `Error in flight from ${ukAirport} to ${overseasAirportCode} with ${aircraftType}: ${error}`;
            results.push(result);
        }
    });

    results.forEach(result => console.log(result));
    writeResultsToFile(results, 'invalid_flight_results.txt');
}

// Ensure the results files exist or create them if they don't
function ensureFilesExist() {
    const files = ['valid_flight_results.txt', 'invalid_flight_results.txt'];
    files.forEach(file => {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, '', { flag: 'w' });
        }
    });
}

// Execute the functions
ensureFilesExist();
calculateValidFlights();
handleInvalidFlights();
