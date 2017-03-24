var express = require('express');
var moment = require('moment');
var request = require('request');
var icloud = require('./icloud');
var ifttt = require('./ifttt');
require('dotenv').config();

var googleMapsClient = require('@google/maps').createClient({key: process.env.API_KEY});
var app = express();

app.get('/to/:destination', (req, res) => {
    let home = process.env.HOME_ADDRESS;
    let work = process.env.WORK_ADDRESS;
    if(req.params.destination == 'home'){
        requestETA(work, home, res)
    } else if(req.params.destination == 'work'){
        requestETA(home, work, res)
    }
})

// combined into both directions of travel
var baseParams = {
    mode: 'driving',
    departure_time: new Date(),
    traffic_model: 'best_guess'
}

var composeMessage = eta => process.env.MESSAGE.replace('{{ETA}}', eta);

var requestETA = (from, to, res) => {
    baseParams.origins = [from];
    baseParams.destinations = [to];

    googleMapsClient.distanceMatrix(baseParams, (err, response) => {
        if(err){
            console.error(err)
            res.send(err)
        }else{
            var etaResponse = response.json.rows[0].elements[0].duration_in_traffic.value;
            // add the value (in seconds) to current time, format to localized time
            var etaFormatted = moment().add(etaResponse, 'seconds').format('LT');
            ifttt.notifyIFTT(composeMessage(etaFormatted));

            icloud.notifyIcloud(process.env.ICLOUD_DEVICE_ID, composeMessage(etaFormatted), (device)=>{
                console.log(`notified device ${device}`);
            })
            res.send(JSON.stringify(etaFormatted));
        }
    })
}

app.listen(process.argv[2])
