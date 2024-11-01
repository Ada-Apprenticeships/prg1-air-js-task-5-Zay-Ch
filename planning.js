const fs = require("fs");
const readline = require("readline");

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
    return undefined; // Change from [] to undefined
  }
}

// Helper function to write results to a text file
function writeResultsToFile(results, filename) {
  const output = results.join("\n");
  fs.writeFileSync(filename, output, { flag: "w" });
}

// Helper function to parse flight data
function parseFlightData(flight) {
  if (!flight) return null; // Return null if flight is undefined

  return {
    ukAirport: flight["UK airport"],
    overseasAirportCode: flight["Overseas airport"] || "", // Provide default if missing
    aircraftType: flight["Type of aircraft"] || "", // Provide default if missing
    economySeats: parseInt(flight["Number of economy seats booked"], 10) || 0, // Default to 0
    businessSeats: parseInt(flight["Number of business seats booked"], 10) || 0, // Default to 0
    firstClassSeats:
      parseInt(flight["Number of first class seats booked"], 10) || 0, // Default to 0
    economyPrice: parseFloat(flight["Price of a economy class seat"]) || 0.0, // Default to 0.0
    businessPrice: parseFloat(flight["Price of a business class seat"]) || 0.0, // Default to 0.0
    firstClassPrice: parseFloat(flight["Price of a first class seat"]) || 0.0, // Default to 0.0
  };
}

function calculateValidFlights() {
  const airports = readCsv("airports.csv");
  const aeroplanes = readCsv("aeroplanes.csv");
  const validFlights = readCsv("valid_flight_data.csv");

  console.log(validFlights); // Debugging line

  const results = [];

  validFlights.forEach((flight) => {
    // Ensure flight is defined and has the required properties
    if (!flight) {
      console.log("Flight data is undefined or empty");
      return; // Skip if flight is not defined
    }

    const flightData = parseFlightData(flight);

    // Check if flightData is valid
    if (
      !flightData ||
      !flightData.overseasAirportCode ||
      !flightData.aircraftType
    ) {
      console.log("Invalid flight data:", flightData);
      return; // Skip if flight data is invalid
    }

    const airport = airports.find(
      (a) => a.code === flightData.overseasAirportCode
    );
    const aeroplane = aeroplanes.find(
      (a) => a.type === flightData.aircraftType
    );

    if (airport && aeroplane) {
      const distance =
        flightData.ukAirport === "MAN"
          ? parseInt(airport.distanceMAN, 10)
          : parseInt(airport.distanceLGW, 10);
      const maxRange = parseInt(aeroplane["maxflightrange(km)"], 10);
      const totalSeats =
        flightData.economySeats +
        flightData.businessSeats +
        flightData.firstClassSeats;

      if (
        distance <= maxRange &&
        totalSeats <=
          parseInt(aeroplane.economyseats, 10) +
            parseInt(aeroplane.businessseats, 10) +
            parseInt(aeroplane.firstclassseats, 10)
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

        const result = `Flight from ${flightData.ukAirport} to ${
          flightData.overseasAirportCode
        } with ${flightData.aircraftType}:\nIncome: £${income.toFixed(
          2
        )}, Cost: £${totalCost.toFixed(2)}, Profit: £${profit.toFixed(2)}`;
        results.push(result);
      }
    } else {
      console.log(`No matching airport or aeroplane for flight: ${flightData}`);
    }
  });

  // Write results to a file only if there are valid results
  if (results.length > 0) {
    writeResultsToFile(results, "valid_flight_results.txt");
  } else {
    console.log("No valid flights to process");
  }

  return results; // Optional: Return results if needed
}

// Function to handle user input and calculate flights
function promptUserForFlightData() {
  if (process.env.NODE_ENV === "test") {
    return; // Do nothing in test mode
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("Enter flight details:");

  rl.question("UK Airport (e.g., MAN): ", (ukAirport) => {
    rl.question("Overseas Airport (e.g., JFK): ", (overseasAirport) => {
      rl.question("Type of Aircraft: ", (aircraftType) => {
        rl.question("Number of Economy Seats Booked: ", (economySeats) => {
          rl.question("Number of Business Seats Booked: ", (businessSeats) => {
            rl.question(
              "Number of First Class Seats Booked: ",
              (firstClassSeats) => {
                rl.question("Price of Economy Class Seat: ", (economyPrice) => {
                  rl.question(
                    "Price of Business Class Seat: ",
                    (businessPrice) => {
                      rl.question(
                        "Price of First Class Seat: ",
                        (firstClassPrice) => {
                          const flightData = {
                            "UK airport": ukAirport,
                            "Overseas airport": overseasAirport,
                            "Type of aircraft": aircraftType,
                            "Number of economy seats booked": economySeats,
                            "Number of business seats booked": businessSeats,
                            "Number of first class seats booked":
                              firstClassSeats,
                            "Price of a economy class seat": economyPrice,
                            "Price of a business class seat": businessPrice,
                            "Price of a first class seat": firstClassPrice,
                          };

                          // Calculate and display results
                          const results = calculateValidFlights(
                            parseFlightData(flightData)
                          );
                          if (results.length > 0) {
                            console.log("\nValid Flights Results:");
                            results.forEach((result) => console.log(result));
                            rl.question(
                              "Would you like to save the results to a file? (yes/no): ",
                              (answer) => {
                                if (answer.toLowerCase() === "yes") {
                                  writeResultsToFile(
                                    results,
                                    "user_flight_results.txt"
                                  );
                                  console.log(
                                    "Results saved to user_flight_results.txt"
                                  );
                                }
                                rl.close();
                              }
                            );
                          } else {
                            console.log("No valid flights found.");
                            rl.close();
                          }
                        }
                      );
                    }
                  );
                });
              }
            );
          });
        });
      });
    });
  });
}

// Function to handle invalid flights - Validates flight data and logs errors for invalid flights
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

// Call the user prompt function when running the script
promptUserForFlightData();

// Ensure the results files exist or create them if they don't
function ensureFilesExist() {
  const files = ["valid_flight_results.txt", "invalid_flight_results.txt"];
  files.forEach((file) => {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, "", { flag: "w" });
    }
  });
}

// Run the ensureFilesExist function
ensureFilesExist();

// Export functions to be used in other modules
module.exports = {
  readCsv,
  writeResultsToFile,
  parseFlightData,
  ensureFilesExist,
  calculateValidFlights,
  promptUserForFlightData,
  handleInvalidFlights,
};
