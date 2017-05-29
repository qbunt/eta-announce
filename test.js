module.exports = test = {};
require('dotenv').config()
let googleMapsClient = require('@google/maps').createClient({key: process.env.MAPS_KEY});

test.calcETA = () => {
    // WORK_ADDRESS="18500 Crenshaw Blvd., Torrance, CA"
    // HOME_ADDRESS="2044 National Ave., Costa Mesa, CA"
    // MAPS_KEY=AIzaSyAzC5fjZk6AscW6OC8yzH0fwJ3xl3NEf1w
    // DEPARTURE_OFFSET=5m
    // SERVER_PORT=4000
    from = process.env.WORK_ADDRESS
    to = process.env.HOME_ADDRESS
    let departureOffset = 0
    var requestObj = {
        origins: [from],
        destinations: [to],
        mode: 'driving',
        departure_time: 'now',
        traffic_model: 'best_guess'
    };
    googleMapsClient.distanceMatrix(requestObj, (err, response) => {
        if(err){
            console.err(err)
        } else {
            var timeInTraffic = response.json.rows[0].elements[0].duration_in_traffic;
            console.log(timeInTraffic);
        }
    })
}

test.calcETA();