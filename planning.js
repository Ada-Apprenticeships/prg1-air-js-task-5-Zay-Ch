const fs = require("fs");

// Function to reads the content of a CSV file and converts it into an array of objects.
// Each object represents a row in the CSV file, with keys corresponding to the headers.
function readCsv(filename, delimiter = ",") {
  try {
    const fileContent = fs.readFileSync(filename, { encoding: "utf-8" }); // Read the file content synchronously
    const rows = fileContent
      .split("\n")
      .map((row) => row.trim())
      .filter((row) => row); // Filters empty rows

    const headers = rows[0].split(delimiter).map((header) => header.trim()); // Extracts headers in first row
    const data = rows.slice(1).map((row) => {
      // Maps remaining rows to objects using headers as keys
      const values = row.split(delimiter).map((value) => value.trim());
      return headers.reduce((acc, header, index) => {
        acc[header] = values[index];
        return acc;
      }, {});
    });
    return data;
  } catch (err) {
    console.log("Error reading file:", filename); // Log which file causes errors
  }
}

function writeResultsToFile(results, filename) {
  const output = results.join("\n");
  try {
    fs.writeFileSync(filename, output, { flag: "w" });
  } catch (error) {
    console.error(`Failed to write to file ${filename}:`, error);
  }
}

// Helper function to parse flight data - Converts the flight data from CSV format to structured object
function parseFlightData(flight) {
  return {
    // Extracting and parsing the data
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
  const results = []; // Initialising an array to store results

  validFlights.forEach((flight) => {
    // Iterating over each valid flight to process the data
    const flightData = parseFlightData(flight);
    const airport = airports.find(
      (a) => a.code === flightData.overseasAirportCode // Finding matching airports
    );
    const aeroplane = aeroplanes.find(
      (a) => a.type === flightData.aircraftType // Finding matching aircrafts
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
        // Checks if distance is withing range AND total seats do not exceed capacity
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
function handleInvalidFlights() {
  const airports = readCsv("airports.csv");
  const aeroplanes = readCsv("aeroplanes.csv");
  const invalidFlights = readCsv("invalid_flight_data.csv");

  // Debugging: Check what invalid flights data is being read
  console.log("Invalid flights data:", invalidFlights);

  const results = [];

  invalidFlights.forEach((flight) => {
    // Parse flight data
    const flightData = parseFlightData(flight);
    const airport = airports.find(
      (a) => a.code === flightData.overseasAirportCode
    );
    const aeroplane = aeroplanes.find(
      (a) => a.type === flightData.aircraftType
    );

    let error = null;

    if (!airport) {
      error = `Invalid airport code: ${flightData.overseasAirportCode}`;
    } else if (!aeroplane) {
      error = `Invalid aircraft type: ${flightData.aircraftType}`;
    } else {
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

    // Log error if one exists
    if (error) {
      const result = `Error in flight from ${flightData.ukAirport} to ${flightData.overseasAirportCode} with ${flightData.aircraftType}: ${error}`;
      results.push(result);
      console.log(result); // Log each result for debugging
    }
  });

  // Log the number of errors found
  console.log(`${results.length} invalid flights found.`);

  // Log results array before writing to file
  console.log("Invalid flight results to be written:", results);

  if (results.length > 0) {
    writeResultsToFile(results, "invalid_flight_results.txt");
    console.log("Invalid flight results written to invalid_flight_results.txt");
  } else {
    console.log("No invalid flights found.");
  }
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

// Export functions to be used in other modules
module.exports = {
  readCsv,
  writeResultsToFile,
  parseFlightData,
  ensureFilesExist,
  calculateValidFlights,
  handleInvalidFlights,
};
