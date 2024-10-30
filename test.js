const fs = require('fs');
const { readCsv, ensureFilesExist, calculateValidFlights, handleInvalidFlights } = require('./planning'); // Import necessary functions

describe('Flight Calculation Tests', () => {
    let expect;

    before(async () => {
        const chai = await import('chai');
        expect = chai.expect;

        // Prepare test data as before
        const airportsData = 'code,full name,distanceMAN,distanceLGW\nABC,Airport ABC,1000,900';
        const aeroplanesData = 'type,economyseats,businessseats,firstclassseats,maxflightrange,runningcostperseatper100km\nBoeing,100,50,10,1200,10';
        const validFlightsData = 'UK airport,Overseas airport,Type of aircraft,Number of economy seats booked,Number of business seats booked,Number of first class seats booked,Price of a economy class seat,Price of a business class seat,Price of a first class seat\nMAN,ABC,Boeing,80,30,5,100,200,500';
        const invalidFlightsData = 'UK airport,Overseas airport,Type of aircraft,Number of economy seats booked,Number of business seats booked,Number of first class seats booked,Price of a economy class seat,Price of a business class seat,Price of a first class seat\nMAN,ABC,Boeing,120,30,5,100,200,500';

        fs.writeFileSync('airports.csv', airportsData);
        fs.writeFileSync('aeroplanes.csv', aeroplanesData);
        fs.writeFileSync('valid_flight_data.csv', validFlightsData);
        fs.writeFileSync('invalid_flight_data.csv', invalidFlightsData);
        
        // Ensure result files exist before running tests
        ensureFilesExist();
    });

    it('should read CSV files correctly', async () => {
        const airports = await readCsv('airports.csv');
        expect(airports).to.be.an('array');
        expect(airports[0]).to.have.property('code', 'ABC');
    });

    it('should calculate valid flights correctly', async () => {
        await calculateValidFlights();  // This should now work
        const results = fs.readFileSync('valid_flight_results.txt', 'utf-8');

        // Check if the calculated values are correct based on input data
        const expectedIncome = (80 * 100) + (30 * 200) + (5 * 500); // Income calculation
        const expectedCost = 10 * (1000 / 100) * (80 + 30 + 5); // Cost calculation based on distance and seats
        const expectedProfit = expectedIncome - expectedCost;

        expect(results).to.include(`Income: £${expectedIncome.toFixed(2)}`);
        expect(results).to.include(`Cost: £${expectedCost.toFixed(2)}`);
        expect(results).to.include(`Profit: £${expectedProfit.toFixed(2)}`);
    });

    it('should handle invalid flights correctly', async () => {
        await handleInvalidFlights();  // This should now work
        const results = fs.readFileSync('invalid_flight_results.txt', 'utf-8');

        expect(results).to.be.a('string');
        expect(results).to.include('Error in flight from MAN to ABC with Boeing: Too many economy seats booked');
    });

    after(() => {
        // Clean up test data
        fs.unlinkSync('airports.csv');
        fs.unlinkSync('aeroplanes.csv');
        fs.unlinkSync('valid_flight_data.csv');
        fs.unlinkSync('invalid_flight_data.csv');
        if (fs.existsSync('valid_flight_results.txt')) {
            fs.unlinkSync('valid_flight_results.txt');
        }
        if (fs.existsSync('invalid_flight_results.txt')) {
            fs.unlinkSync('invalid_flight_results.txt');
        }
    });
});