"use strict";
const moment = require('moment');
const request = require('request');
const express = require('express');
require('dotenv').config();

const app = express();

const ifttt = require('./ifttt');
const twilio = require('./twilio');

/**
 * Returns a formatted message with localized ETA
 * @param localizedETA
 * @returns {Promise.<string>}
 */
let composeMessage = localizedETA => {
    var msg = process.env.MESSAGE;
    var name = process.env.NAME
    var assembledMessage = msg.replace('{{ETA}}', localizedETA).replace('{{NAME}}', name)
    return Promise.resolve(assembledMessage);
};

let googleMapsClient = require('@google/maps').createClient({key: process.env.MAPS_API_KEY});

/**
 * uses the google distance matrix API to determine ETA using best-guess routing
 * @param from
 * @param to
 * @returns {Promise}
 */
var requestETA = (from, to)=>{
    let departureOffset = process.env.DEPARTURE_OFFSET_MINUTES || 0;
    var requestObj = {
        origins: [from],
        destinations: [to],
        mode: 'driving',
        departure_time: moment().utcOffset(process.env.DEPARTURE_TZ).add(departureOffset, 'm').toDate(),
        traffic_model: 'best_guess'
    }

    return new Promise((resolve, reject) => {
        googleMapsClient.distanceMatrix(requestObj, (err, response) => {
            if(err){
                reject(err)
            } else {
                var timeInTraffic = response.json.rows[0].elements[0].duration_in_traffic.value;
                resolve(timeInTraffic);
            }
        })
    })
}

/**
 * gets the total minutes in traffic from seconds
 * @param trafficSeconds
 * @returns {Promise}
 */
var calcTrafficMinutes = trafficSeconds => Promise.resolve(
    moment.duration(trafficSeconds, 'seconds').minutes()
)

/**
 * formats the ETA into a time string
 * @param trafficTime
 * @returns {Promise}
 */
var formatTime = trafficTime => Promise.resolve(
    moment().add(trafficTime, 'minutes').format('LT')
)

app.get('/from/:origin/to/:destination', (req, res)=>{
    var dest = req.params.destination;
    var origin = req.params.origin;
    console.time('request')

    if(dest != '' &&  origin != ''){
        requestETA(origin, dest)
            .then(calcTrafficMinutes)
            .then(minutes => {
                ifttt.notify('traffic_time', minutes)
                return minutes;
            })
            .then(formatTime)
            .then(composeMessage)
            .then((message) => {
                twilio.notify(process.env.TWILIO_RECIPIENT_PHONE, message)
                ifttt.notify('eta', message)
                return message
            })
            .then((message) => {
                res.send(`Generated ${new Date()} - '${message}'`)
                console.timeEnd('request')
            })
            .catch(err => {
                res.status(500).send('everything is broken...', err);
            })
    } else {
        res.status(400).send('origin and destination is required')
    }
})
app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), ()=>{
    console.log(`listening on ${app.get('port')}`)
})
