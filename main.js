var express = require('express');
var moment = require('moment');
var request = require('request');
// notifiers
var icloud = require('./icloud');
var ifttt = require('./ifttt');
var twilio = require('./twilio');
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

var composeMessage = eta => process.env.MESSAGE.replace('{{ETA}}', eta).replace('{{NAME}}', process.env.NAME);

var requestETA = (from, to, res) => {
    baseParams.origins = [from];
    baseParams.destinations = [to];

    googleMapsClient.distanceMatrix(baseParams, (err, response) => {
        if(err){
            console.error(err)
            res.send(err)
        }else{
            var etaResponse = Promise.resolve(response.json.rows[0].elements[0].duration_in_traffic.value);
            etaResponse.then(composedResponse => {
                    // add the value (in seconds) to current time, format to localized time
                    return moment().add(composedResponse, 'seconds').format('LT');
                }).then(composedMessage=>{
                    console.log('composing message...')
                    return composeMessage(composedMessage);

                }).then(message => {
                    console.log(`message is:: '${message}'`)
                    twilio.notify(process.env.TWILIO_RECIPIENT_PHONE, message)
                    console.log(`twilio notified...`)
                    return message
                }).then(etaResponse)
                .then(response=>{
                    ifttt.notify(response)
                })
                .then(response => {
                    console.log(response)
                    res.send('message successful')
                }).catch(err => {

                    console.error(err)

                })
        }
    })
}

app.listen(process.argv[2])
