const fs = require("fs");

// Function to read and parse a CSV file
// Reads the content of a CSV file and converts it into an array of objects.
// Each object represents a row in the CSV file, with keys corresponding to the headers.
function readCsv(filename, delimiter = ",") {
  try {
    const fileContent = fs.readFileSync(filename, { encoding: "utf-8" });
    const rows = fileContent
      .split("\n")
      .map((row) => row.trim())
      .filter((row) => row);
    const headers = rows[0].split(delimiter).map((header) => header.trim());
    const data = rows.slice(1).map((row) => {
      const values = row.split(delimiter).map((value) => value.trim());
      return headers.reduce((acc, header, index) => {
        acc[header] = values[index];
        return acc;
      }, {});
    });
    return data;
  } catch (err) {
    console.log("Error reading file:", filename);
  }
}

// Helper function to write results to a text file
function writeResultsToFile(results, filename) {
  const output = results.join("\n");
  fs.writeFileSync(filename, output, { flag: "w" }); // 'w' flag creates the file if it does not exist
}

// Helper function to parse flight data
function parseFlightData(flight) {
  return {
    ukAirport: flight["UK airport"],
    overseasAirportCode: flight["Overseas airport"],
    aircraftType: flight["Type of aircraft"],
    economySeats: parseInt(flight["Number of economy seats booked"]),
    businessSeats: parseInt(flight["Number of business seats booked"]),
    firstClassSeats: parseInt(flight["Number of first class seats booked"]),
    economyPrice: parseFloat(flight["Price of a economy class seat"]),
    businessPrice: parseFloat(flight["Price of a business class seat"]),
    firstClassPrice: parseFloat(flight["Price of a first class seat"]),
  };
}

// Function reads flight data and calculates income, cost, and profit for each valid flight.
function calculateValidFlights() {
  const airports = readCsv("airports.csv");
  const aeroplanes = readCsv("aeroplanes.csv");
  const validFlights = readCsv("valid_flight_data.csv");
  const results = [];

  validFlights.forEach((flight) => {
    // Iterate over each valid flight to process the data
    const flightData = parseFlightData(flight);
    const airport = airports.find(
      (a) => a.code === flightData.overseasAirportCode
    );
    const aeroplane = aeroplanes.find(
      (a) => a.type === flightData.aircraftType
    );

    if (airport && aeroplane) {
      // If both valid proceed
      const distance =
        flightData.ukAirport === "MAN"
          ? parseInt(airport.distanceMAN)
          : parseInt(airport.distanceLGW);
      const maxRange = parseInt(aeroplane["maxflightrange(km)"]);
      const totalSeats =
        flightData.economySeats +
        flightData.businessSeats +
        flightData.firstClassSeats;

      // Validate the flight based on distance and total seats
      if (
        distance <= maxRange &&
        totalSeats <=
          parseInt(aeroplane.economyseats) +
            parseInt(aeroplane.businessseats) +
            parseInt(aeroplane.firstclassseats)
      ) {
        const income =
          flightData.economySeats * flightData.economyPrice +
          flightData.businessSeats * flightData.businessPrice +
          flightData.firstClassSeats * flightData.firstClassPrice;
        const costPerSeat =
          parseFloat(aeroplane.runningcostperseatper100km.replace("£", "")) *
          (distance / 100);
        const totalCost = costPerSeat * totalSeats;
        const profit = income - totalCost;
        // Format the result and add it to results array
        const result = `Flight from ${flightData.ukAirport} to ${
          flightData.overseasAirportCode
        } with ${flightData.aircraftType}:\nIncome: £${income.toFixed(
          2
        )}, Cost: £${totalCost.toFixed(2)}, Profit: £${profit.toFixed(2)}`;
        results.push(result);
      }
    }
  });
  if (results.length > 0) {
    writeResultsToFile(results, "valid_flight_results.txt");
  }
}

// Function to handle invalid flights
function handleInvalidFlights() {
  const airports = readCsv("airports.csv");
  const aeroplanes = readCsv("aeroplanes.csv");
  const invalidFlights = readCsv("invalid_flight_data.csv");
  const results = [];

  invalidFlights.forEach((flight) => {
    // Iterate over each invalid flight to process the data
    const flightData = parseFlightData(flight);
    const airport = airports.find(
      (a) => a.code === flightData.overseasAirportCode
    );
    const aeroplane = aeroplanes.find(
      (a) => a.type === flightData.aircraftType
    );

    let error = null; // Variable to store any error message
    if (!airport) {
      error = `Invalid airport code: ${flightData.overseasAirportCode}`;
    } else if (!aeroplane) {
      error = `Invalid aircraft type: ${flightData.aircraftType}`;
    } else {
      // Calculate distance and other metrics for validation
      const distance =
        flightData.ukAirport === "MAN"
          ? parseInt(airport.distanceMAN)
          : parseInt(airport.distanceLGW);
      const maxRange = parseInt(aeroplane.maxflightrange);
      const totalSeats =
        flightData.economySeats +
        flightData.businessSeats +
        flightData.firstClassSeats;

      // Validate distance and seat bookings
      if (distance > maxRange) {
        error = `Aircraft ${flightData.aircraftType} doesn't have the range to fly to ${flightData.overseasAirportCode}`;
      } else if (flightData.economySeats > parseInt(aeroplane.economyseats)) {
        error = `Too many economy seats booked (${flightData.economySeats} > ${aeroplane.economyseats})`;
      } else if (flightData.businessSeats > parseInt(aeroplane.businessseats)) {
        error = `Too many business seats booked (${flightData.businessSeats} > ${aeroplane.businessseats})`;
      } else if (
        flightData.firstClassSeats > parseInt(aeroplane.firstclassseats)
      ) {
        error = `Too many first-class seats booked (${flightData.firstClassSeats} > ${aeroplane.firstclassseats})`;
      } else if (
        totalSeats >
        parseInt(aeroplane.economyseats) +
          parseInt(aeroplane.businessseats) +
          parseInt(aeroplane.firstclassseats)
      ) {
        error = `Too many total seats booked (${totalSeats} > ${
          parseInt(aeroplane.economyseats) +
          parseInt(aeroplane.businessseats) +
          parseInt(aeroplane.firstclassseats)
        })`;
      }
    }
    if (error) {
      const result = `Error in flight from ${flightData.ukAirport} to ${flightData.overseasAirportCode} with ${flightData.aircraftType}: ${error}`;
      results.push(result);
    }
  });
  writeResultsToFile(results, "invalid_flight_results.txt");
}

// Ensure the results files exist or create them if they don't
function ensureFilesExist() {
  const files = ["valid_flight_results.txt", "invalid_flight_results.txt"];
  files.forEach((file) => {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, "", { flag: "w" });
    }
  });
}

module.exports = {
  readCsv,
  writeResultsToFile,
  parseFlightData,
  ensureFilesExist,
  calculateValidFlights,
  handleInvalidFlights,
};
