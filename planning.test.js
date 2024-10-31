const {
  readCsv,
  writeResultsToFile,
  parseFlightData,
  calculateValidFlights,
  handleInvalidFlights,
  ensureFilesExist,
} = require("./planning");
const fs = require("fs");

describe("Flight Planning Project Tests", () => {
  const airportsCSV = `code,full name,distanceMAN,distanceLGW
JFK,John F Kennedy International,5376,5583
ORY,Paris-Orly,610,325
MAD,Madrid-Barajas,1435,1216
AMS,Amsterdam Schiphol,485,363
CAI,Cairo International,3740,3494
`;
  const aeroplanesCSV = `type, runningcostperseatper100km, maxflightrange(km), economyseats, businessseats, firstclassseats
Medium narrow body,£8,2650,160,12,0
Large narrow body,£7,5600,180,20,4
Medium wide body,£5,4050,380,20,8
`;
  const validFlightsCSV = `UK airport,Overseas airport,Type of aircraft,Number of economy seats booked,Number of business seats booked,Number of first class seats booked,Price of a economy class seat,Price of a business class seat,Price of a first class seat
MAN,JFK,Large narrow body,150,12,2,399,999,1899
`;
  const invalidFlightsCSV = `UK airport,Overseas airport,Type of aircraft,Number of economy seats booked,Number of business seats booked,Number of first class seats booked,Price of a economy class seat,Price of a business class seat,Price of a first class seat
MAN,JFK,Medium narrow body,150,12,2,399,999,1899  # Error: Medium narrow body doesn't have the range to fly to JFK
`;

  beforeEach(() => {
    fs.readFileSync.mockImplementation((path) => {
      switch (path) {
        case "airports.csv":
          return airportsCSV;
        case "aeroplanes.csv":
          return aeroplanesCSV;
        case "valid_flight_data.csv":
          return validFlightsCSV;
        case "invalid_flight_data.csv":
          return invalidFlightsCSV;
        default:
          throw new Error(`Unknown file path: ${path}`);
      }
    });
    fs.writeFileSync.mockClear();
  });

  describe("readCsv", () => {
    test("should read and parse CSV file correctly", () => {
      const airports = readCsv("airports.csv");
      expect(airports).toEqual([
        { code: "JFK", "full name": "John F Kennedy International", distanceMAN: "5376", distanceLGW: "5583" },
        { code: "ORY", "full name": "Paris-Orly", distanceMAN: "610", distanceLGW: "325" },
        { code: "MAD", "full name": "Madrid-Barajas", distanceMAN: "1435", distanceLGW: "1216" },
        { code: "AMS", "full name": "Amsterdam Schiphol", distanceMAN: "485", distanceLGW: "363" },
        { code: "CAI", "full name": "Cairo International", distanceMAN: "3740", distanceLGW: "3494" },
      ]);
    });

    test("should handle file read error gracefully", () => {
      fs.readFileSync.mockImplementationOnce(() => {
        throw new Error("File not found");
      });
      const data = readCsv("nonexistent.csv");
      expect(data).toBeNull();
    });
  });

  describe("writeResultsToFile", () => {
    test("should write results to a file", () => {
      const results = ["Flight details: ...", "Profit: £1000.00"];
      writeResultsToFile(results, "results.txt");
      expect(fs.writeFileSync).toHaveBeenCalledWith("results.txt", results.join("\n"), { flag: "w" });
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
      expect(fs.writeFileSync).toHaveBeenCalledWith("valid_flight_results.txt", expectedResults.join("\n"), { flag: "w" });
    });
  });

  describe("handleInvalidFlights", () => {
    test("should handle invalid flights and write errors to file", () => {
      handleInvalidFlights();
      const expectedResults = [
        "Error in flight from MAN to JFK with Medium narrow body: Medium narrow body doesn't have the range to fly to JFK",
      ];
      expect(fs.writeFileSync).toHaveBeenCalledWith("invalid_flight_results.txt", expectedResults.join("\n"), { flag: "w" });
    });
  });

  describe("ensureFilesExist", () => {
    test("should create result files if they do not exist", () => {
      fs.existsSync.mockReturnValue(false);
      ensureFilesExist();
      expect(fs.writeFileSync).toHaveBeenCalledWith("valid_flight_results.txt", "", { flag: "w" });
      expect(fs.writeFileSync).toHaveBeenCalledWith("invalid_flight_results.txt", "", { flag: "w" });
    });

    test("should not create result files if they already exist", () => {
      fs.existsSync.mockReturnValue(true);
      ensureFilesExist();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });
});