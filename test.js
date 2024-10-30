const fs = require('fs');

const {
    ensureFilesExist,
    calculateValidFlights,
    handleInvalidFlights,
} =  require("./planning.js");

describe('Flight Calculation Tests', () => {
    before(() => {
        // Prepare test data
        const airportsData = 'code,full name,distanceMAN,distanceLGW\nABC,Airport ABC,1000,900';
        const aeroplanesData = 'type,economyseats,businessseats,firstclassseats,maxflightrange,runningcostperseatper100km\nBoeing,100,50,10,1200,£10';
        const validFlightsData = 'UK airport,Overseas airport,Type of aircraft,Number of economy seats booked,Number of business seats booked,Number of first class seats booked,Price of a economy class seat,Price of a business class seat,Price of a first class seat\nMAN,ABC,Boeing,80,30,5,100,200,500';

        fs.writeFileSync('airports.csv', airportsData);
        fs.writeFileSync('aeroplanes.csv', aeroplanesData);
        fs.writeFileSync('valid_flight_data.csv', validFlightsData);
        fs.writeFileSync('invalid_flight_data.csv', validFlightsData);
    });

    it('should read CSV files correctly', () => {
        const data = readCsv('airports.csv');
        expect(data).to.be.an('array');
        expect(data[0]).to.have.property('code', 'ABC');
    });

    it('should calculate valid flights correctly', () => {
        calculateValidFlights();
        const results = fs.readFileSync('valid_flight_results.txt', 'utf-8');
        expect(results).to.include('Income: £28500.00');
        expect(results).to.include('Cost: £11550.00');
        expect(results).to.include('Profit: £16950.00');
    });

    it('should handle invalid flights correctly', () => {
        handleInvalidFlights();
        const results = fs.readFileSync('invalid_flight_results.txt', 'utf-8');
        expect(results).to.be.a('string');
    });

    after(() => {
        // Clean up test data
        fs.unlinkSync('airports.csv');
        fs.unlinkSync('aeroplanes.csv');
        fs.unlinkSync('valid_flight_data.csv');
        fs.unlinkSync('invalid_flight_data.csv');
        fs.unlinkSync('valid_flight_results.txt');
        fs.unlinkSync('invalid_flight_results.txt');
    });
});