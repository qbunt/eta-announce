
const moment = require('moment');
const request = require('request');

const express = require('express')
const app = express();

// notifiers
const ifttt = require('./ifttt');
const twilio = require('./twilio');
require('dotenv').config();

/**
 * Returns a formatted message with localized ETA
 * @param localizedETA
 * @returns {Promise.<string>}
 */
var composeMessage = localizedETA => {
    var msg = process.env.MESSAGE;
    var name = process.env.NAME
    var assembledMessage = msg.replace('{{ETA}}', localizedETA).replace('{{NAME}}', name)
    return Promise.resolve(assembledMessage);
};

var googleMapsClient = require('@google/maps').createClient({key: process.env.MAPS_API_KEY});

/**
 * uses the google distance matrix API to determine ETA using best-guess routing
 * @param from
 * @param to
 * @returns {Promise}
 */
var requestETA = (from, to)=>{
    var requestObj = {
        origins: [from],
        destinations: [to],
        mode: 'driving',
        departure_time: new Date(),
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
 * formats the ETA into an english message
 * @param trafficTime
 * @returns {Promise}
 */
var formatTime = trafficTime => Promise.resolve(
    moment().add(trafficTime, 'seconds').format('LT')
)

app.get('/from/:origin/to/:destination', (req, res)=>{
    var dest = req.params.destination;
    var origin = req.params.origin;
    console.time('request')

    if(dest != '' &&  origin != ''){
        requestETA(origin, dest)
            .then(calcTrafficMinutes)
            .then(minutes => ifttt.notify('traffic_time', minutes))
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
