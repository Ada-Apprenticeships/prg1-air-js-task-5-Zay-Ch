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

const airportsFilePath = path.resolve(__dirname, "airports.csv");
const aeroplanesFilePath = path.resolve(__dirname, "aeroplanes.csv");
const validFlightsFilePath = path.resolve(__dirname, "valid_flight_data.csv");
const invalidFlightsFilePath = path.resolve(
  __dirname,
  "invalid_flight_data.csv"
);
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
  const airportsCSV = "airport.csv";
  const aeroplanesCSV = "aeroplanes.csv";
  const validFlightsCSV = `valid_flight_data.csv`;
  const invalidFlightsCSV = `invalid_flight_data.csv`;

  describe("readCsv", () => {
    test("should read and parse CSV file correctly", () => {
      const airports = readCsv(airportsFilePath);
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

    test("should handle file read error gracefully", () => {
      expect(readCsv("nonexistent.csv")).toBeUndefined();
    });
  });

  describe("writeResultsToFile", () => {
    test("should write results to a file", () => {
      const results = ["Flight details: ...", "Profit: ..."];
      writeResultsToFile(results, resultsFilePath);
      const writtenContent = fs.readFileSync(resultsFilePath, "utf8");
      expect(writtenContent).toEqual(results.join("\n"));
    });
  });

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

  describe("calculateValidFlights", () => {
    test("should calculate valid flights and write to file", () => {
      calculateValidFlights();
      const expectedResults = [
        "Flight from MAN to JFK with Large narrow body:\nIncome: £1049850.00, Cost: £84840.00, Profit: £964010.00",
      ];
      const writtenContent = fs.readFileSync(validResultsFilePath, "utf8");
      expect(writtenContent).toEqual(expectedResults.join("\n"));
    });
  });

  describe("handleInvalidFlights", () => {
    test("should handle invalid flights and write errors to file", () => {
      handleInvalidFlights();
      const expectedResults = [
        "Error in flight from MAN to JFK with Medium narrow body: Medium narrow body doesn't have the range to fly to JFK",
      ];
      const writtenContent = fs.readFileSync(invalidResultsFilePath, "utf8");
      expect(writtenContent).toEqual(expectedResults.join("\n"));
    });
  });

  describe("ensureFilesExist", () => {
    test("should create result files if they do not exist", () => {
      ensureFilesExist();
      expect(fs.existsSync(validResultsFilePath)).toBeTruthy();
      expect(fs.existsSync(invalidResultsFilePath)).toBeTruthy();
    });

    test("should not create result files if they already exist", () => {
      fs.writeFileSync(validResultsFilePath, "dummy content");
      fs.writeFileSync(invalidResultsFilePath, "dummy content");
      ensureFilesExist();
      expect(fs.readFileSync(validResultsFilePath, "utf8")).toEqual(
        "dummy content"
      );
      expect(fs.readFileSync(invalidResultsFilePath, "utf8")).toEqual(
        "dummy content"
      );
    });
  });

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
