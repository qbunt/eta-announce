var express = require('express');
var moment = require('moment');
var request = require('request');
var icloud = require('./icloud');
var ifttt = require('./ifttt');
require('dotenv').config();



var googleMapsClient = require('@google/maps').createClient({key: process.env.API_KEY});
var app = express();

app.get('/to/:destination', (req, res) => {
    if(req.params.destination == 'home'){
        requestETA(process.env.WORK_ADDRESS, process.env.HOME_ADDRESS, res)
    } else if(req.params.destination == 'work'){
        requestETA(process.env.HOME_ADDRESS, process.env.WORK_ADDRESS, res)
    }
})

// this gets combined into direction of traffic
var baseParams = {
    mode: 'driving',
    departure_time: new Date(),
    traffic_model: 'best_guess'
}

var requestETA = (from, to, res) => {
    baseParams.origins = [from];
    baseParams.destinations = [to];

    googleMapsClient.distanceMatrix(baseParams, (err, response) => {
        if(err){
            console.error(err)
            res.send(err)
        }else{
            var eta = moment().add(response.json.rows[0].elements[0].duration_in_traffic.value, 'seconds').format('LT');
            ifttt.notifyIFTT(eta);

            // icloud.notifyIcloud(process.env.ICLOUD_DEVICE_ID, (device)=>{
            //     console.log(`notified device ${device}`);
            // })
            res.send(JSON.stringify(eta));
        }
    })
}

app.listen(process.argv[2])
