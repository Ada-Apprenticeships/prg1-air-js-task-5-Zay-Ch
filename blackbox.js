const fs = require('fs');

// Function to read CSV files synchronously
function readCsv(filename, delimiter = ',') {
    try {
        const fileContent = fs.readFileSync(filename, { encoding: 'utf-8' });
        const rows = fileContent.split('\n');
        const data = [];

        for (let i = 1; i < rows.length; i++) { // Skip the header row
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

// Function to calculate profitability
function calculateProfitability(flight, airports, aircrafts) {
    const ukAirport = flight[0]; // Assuming the first column is UK airport
    const overseasAirport = flight[1]; // Assuming the second column is overseas airport
    const aircraftType = flight[2]; // Assuming the third column is aircraft type

    // Find distances and aircraft data
    const airportInfo = airports.find(a => a[0] === overseasAirport); // Assuming the first column is airport code
    const aircraftInfo = aircrafts.find(a => a[0] === aircraftType); // Assuming the first column is aircraft type

    if (!airportInfo || !aircraftInfo) {
        return `Invalid airport or aircraft type: ${ukAirport} to ${overseasAirport} using ${aircraftType}`;
    }

    const distance = parseInt(airportInfo[2]); // Assuming the third column is distance from MAN or LGW
    const runningCostPerSeat = parseFloat(aircraftInfo[1].replace('£', '').replace(',', ''));
    const maxFlightRange = parseInt(aircraftInfo[2]);
    const totalEconomySeats = parseInt(aircraftInfo[3]);
    const totalBusinessSeats = parseInt(aircraftInfo[4]);
    const totalFirstClassSeats = parseInt(aircraftInfo[5]);

    // Check for range limits
    if (distance > maxFlightRange) {
        return `Error: ${aircraftType} doesn't have the range to fly to ${overseasAirport}`;
    }

    // Booking details
    const economyBooked = parseInt(flight[3]); // Number of economy seats booked
    const businessBooked = parseInt(flight[4]); // Number of business seats booked
    const firstClassBooked = parseInt(flight[5]); // Number of first class seats booked

    // Check for seat limits
    if (economyBooked > totalEconomySeats) {
        return `Error: Too many economy seats booked (${economyBooked} > ${totalEconomySeats})`;
    }
    if (businessBooked > totalBusinessSeats) {
        return `Error: Too many business seats booked (${businessBooked} > ${totalBusinessSeats})`;
    }
    if (firstClassBooked > totalFirstClassSeats) {
        return `Error: Too many first class seats booked (${firstClassBooked} > ${totalFirstClassSeats})`;
    }

    const totalSeatsBooked = economyBooked + businessBooked + firstClassBooked;
    if (totalSeatsBooked > (totalEconomySeats + totalBusinessSeats + totalFirstClassSeats)) {
        return `Error: Too many total seats booked (${totalSeatsBooked} > ${totalEconomySeats + totalBusinessSeats + totalFirstClassSeats})`;
    }

    // Income calculations
    const incomeEconomy = economyBooked * parseFloat(flight[6]); // Price of an economy class seat
    const incomeBusiness = businessBooked * parseFloat(flight[7]); // Price of a business class seat
    const incomeFirstClass = firstClassBooked * parseFloat(flight[8]); // Price of a first class seat
    const totalIncome = incomeEconomy + incomeBusiness + incomeFirstClass;

    // Cost calculations
    const costPerSeat = runningCostPerSeat * (distance / 100);
    const totalCost = costPerSeat * totalSeatsBooked;

    // Profit calculation
    const profit = totalIncome - totalCost;

    return {
        flightDetails: flight,
        totalIncome: totalIncome,
        totalCost: totalCost,
        profit: profit
    };
}

// Main function to process flights
function processFlights() {
    const airportsData = readCsv('airports.csv');
    const aircraftsData = readCsv('aircrafts.csv');
    const flightsData = readCsv('flights.csv');

    if (!airportsData || !aircraftsData || !flightsData) {
        console.error("Error reading files");
        return;
    }

    flightsData.forEach(flight => {
        const profitability = calculateProfitability(flight, airportsData, aircraftsData);
        console.log(profitability);
    });
}

// Run the main function
processFlights();