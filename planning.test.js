const {
  readCsv,
  writeResultsToFile,
  parseFlightData,
  calculateValidFlights,
  handleInvalidFlights,
  ensureFilesExist,
} = require("./planning.js");

const fs = require("fs");
const path = require("path");

// Define file paths for the CSV and result files
const airportsFilePath = path.resolve(__dirname, "airports.csv");
const resultsFilePath = path.resolve(__dirname, "results.txt");
const validResultsFilePath = path.resolve(
  __dirname,
  "valid_flight_results.txt"
);
const invalidResultsFilePath = path.resolve(
  __dirname,
  "invalid_flight_results.txt"
);

describe("Flight Planning Project Tests", () => {
  // Test readCsv function to ensure it correctly reads and parses the CSV file
  describe("readCsv", () => {
    test("should read and parse CSV file correctly", () => {
      const airports = readCsv(airportsFilePath);
      // Verify the parsed content matches the expected data
      expect(airports).toEqual([
        {
          code: "JFK",
          "full name": "John F Kennedy International",
          distanceMAN: "5376",
          distanceLGW: "5583",
        },
        {
          code: "ORY",
          "full name": "Paris-Orly",
          distanceMAN: "610",
          distanceLGW: "325",
        },
        {
          code: "MAD",
          "full name": "Madrid-Barajas",
          distanceMAN: "1435",
          distanceLGW: "1216",
        },
        {
          code: "AMS",
          "full name": "Amsterdam Schiphol",
          distanceMAN: "485",
          distanceLGW: "363",
        },
        {
          code: "CAI",
          "full name": "Cairo International",
          distanceMAN: "3740",
          distanceLGW: "3494",
        },
      ]);
    });

    // Test for handling errors when the file does not exist
    test("should handle file read error gracefully", () => {
      expect(readCsv("nonexistent.csv")).toBeUndefined();
    });
  });

  // Test writeResultsToFile function to ensure it correctly writes data to a file
  describe("writeResultsToFile", () => {
    test("should write results to a file", () => {
      const results = ["Flight details: ...", "Profit: ..."];
      writeResultsToFile(results, resultsFilePath);
      const writtenContent = fs.readFileSync(resultsFilePath, "utf8");
      // Verify the content written to the file matches the input data
      expect(writtenContent).toEqual(results.join("\n"));
    });
  });

  // Test  parseFlightData function to ensure it correctly parses flight data
  describe("parseFlightData", () => {
    test("should parse flight data correctly", () => {
      const flight = {
        "UK airport": "MAN",
        "Overseas airport": "JFK",
        "Type of aircraft": "Large narrow body",
        "Number of economy seats booked": "150",
        "Number of business seats booked": "12",
        "Number of first class seats booked": "2",
        "Price of a economy class seat": "399",
        "Price of a business class seat": "999",
        "Price of a first class seat": "1899",
      };
      const parsedFlight = parseFlightData(flight);
      // Verify the parsed flight data matches the expected structure
      expect(parsedFlight).toEqual({
        ukAirport: "MAN",
        overseasAirportCode: "JFK",
        aircraftType: "Large narrow body",
        economySeats: 150,
        businessSeats: 12,
        firstClassSeats: 2,
        economyPrice: 399,
        businessPrice: 999,
        firstClassPrice: 1899,
      });
    });
  });

  // Test calculateValidFlights function to ensure it processes valid flights correctly
  describe("calculateValidFlights", () => {
    test("should calculate valid flights and write to file", () => {
      calculateValidFlights();
      const expectedResults = [
        "Flight from MAN to JFK with Large narrow body:\nIncome: £75636.00, Cost: £61716.48, Profit: £13919.52",
        "Flight from LGW to ORY with Medium narrow body:\nIncome: £21600.00, Cost: £3328.00, Profit: £18272.00",
        "Flight from MAN to MAD with Medium wide body:\nIncome: £58400.00, Cost: £11767.00, Profit: £46633.00",
        "Flight from LGW to AMS with Medium narrow body:\nIncome: £14400.00, Cost: £3078.24, Profit: £11321.76",
        "Flight from MAN to CAI with Large narrow body:\nIncome: £97800.00, Cost: £47385.80, Profit: £50414.20",
        "Flight from MAN to ORY with Medium narrow body:\nIncome: £17240.00, Cost: £5709.60, Profit: £11530.40",
        "Flight from LGW to MAD with Large narrow body:\nIncome: £66150.00, Cost: £15662.08, Profit: £50487.92",
        "Flight from MAN to AMS with Medium narrow body:\nIncome: £11650.00, Cost: £3686.00, Profit: £7964.00",
        "Flight from LGW to CAI with Medium wide body:\nIncome: £114400.00, Cost: £34241.20, Profit: £80158.80",
      ];
      const writtenContent = fs.readFileSync(validResultsFilePath, "utf8");
      // Verify the content written to the file matches the expected results
      expect(writtenContent).toEqual(expectedResults.join("\n"));
    });
  });

  // Test handleInvalidFlights function to ensure it processes invalid flights correctly
  describe("handleInvalidFlights", () => {
    test("should handle invalid flights and write errors to file", () => {
      handleInvalidFlights();
      const expectedResults = [
        "Error in flight from MAN to JFK with Medium narrow body: Too many first-class seats booked (2 > 0)",
        "Error in flight from LGW to ORY with Large narrow body: Too many economy seats booked (200 > 180)",
        "Error in flight from MAN to MAD with Medium narrow body: Too many first-class seats booked (2 > 0)",
        "Error in flight from LGW to AMS with Medium narrow body: Too many economy seats booked (180 > 160)",
        "Error in flight from MAN to CAI with Large narrow body: Too many business seats booked (25 > 20)",
        "Error in flight from LGW to JFKKK with Medium wide body: Invalid airport code: JFKKK",
        "Error in flight from MAN to ORY with Medium narrow body: Too many economy seats booked (165 > 160)",
        "Error in flight from LGW to MAD with Large narrow body: Too many business seats booked (22 > 20)",
        "Error in flight from MAN to AMSSS with Medium narrow body: Invalid airport code: AMSSS",
        "Error in flight from LGW to CAI with Medium wide body: Too many economy seats booked (385 > 380)",
      ];
      const writtenContent = fs.readFileSync(invalidResultsFilePath, "utf8");
      // Verify the content written to the file matches the expected errors
      expect(writtenContent).toEqual(expectedResults.join("\n"));
    });
  });

  // Test ensureFilesExist function to ensure it creates necessary result files
  describe("ensureFilesExist", () => {
    test("should create result files if they do not exist", () => {
      ensureFilesExist();
      // Verify the existence of the result files
      expect(fs.existsSync(validResultsFilePath)).toBeTruthy();
      expect(fs.existsSync(invalidResultsFilePath)).toBeTruthy();
    });

    // Test to ensure existing files are not overwritten
    test("should not create result files if they already exist", () => {
      fs.writeFileSync(validResultsFilePath, "dummy content");
      fs.writeFileSync(invalidResultsFilePath, "dummy content");
      ensureFilesExist();
      // Verify the content of the existing files remains unchanged
      expect(fs.readFileSync(validResultsFilePath, "utf8")).toEqual(
        "dummy content"
      );
      expect(fs.readFileSync(invalidResultsFilePath, "utf8")).toEqual(
        "dummy content"
      );
    });
  });

  // Output the test results after all tests have run
  afterAll(() => {
    const results = {
      pass: expect.getState().passed,
      fail: expect.getState().failed,
    };
    console.log(
      `${results.pass} / ${results.pass + results.fail} tests passed, ${
        results.fail
      } tests failed`
    );
  });
});
