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

    if( req.params.destination == 'home'){
        from = work, to = home;
    } else if( req.params.destination){
        from = home, to = work;
    } else {
        res.send('not a valid destination')
    }

    requestAndNotifyETA(from, to).then(response=>{
        console.log(`${new Date()}::response sent, ETA process complete`)
        res.send(response)
    }).catch(err=> {
        console.error(err)
        res.send(`There has been an error::${err}`)
    });
})

// combined into both directions of travel
var baseParams = {
    mode: 'driving',
    departure_time: new Date(),
    traffic_model: 'best_guess'
}

var composeMessage = eta => process.env.MESSAGE.replace('{{ETA}}', eta).replace('{{NAME}}', process.env.NAME);

var requestAndNotifyETA = (from, to) => {
    baseParams.origins = [from];
    baseParams.destinations = [to];

    return new Promise((resolve, reject) =>{
        googleMapsClient.distanceMatrix(baseParams, (err, response) => {
            if(err){
                console.error(err)
                reject(err);
            } else {
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
                // }).then(message=>{
                //     icloud.notify(process.env.ICLOUD_DEVICE_ID, message)
                //     console.log(`icloud notified...`)
                }).then(etaResponse).then(response=>{
                    ifttt.notify(response)
                    console.log(`IFTTT notified...`)
                }).then(() => {
                    console.log('promise stack cleared, resolving...')
                    resolve('message successful');
                }).catch(err => {
                    reject(err)
                })
            }
        })
    })
}

app.listen(process.argv[2])
