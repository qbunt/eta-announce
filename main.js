#!/usr/bin/env node

var moment = require('moment');
var request = require('request');

const notifier = require('node-notifier')
// notifiers
var icloud = require('./icloud');
var ifttt = require('./ifttt');
var twilio = require('./twilio');
require('dotenv').config();

var googleMapsClient = require('@google/maps').createClient({key: process.env.API_KEY});

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
                    // twilio.notify(process.env.TWILIO_RECIPIENT_PHONE, message)
                    // console.log(`twilio notified...`)
                    return message
                // }).then(message=>{
                //     icloud.notify(process.env.ICLOUD_DEVICE_ID, message)
                //     console.log(`icloud notified...`)
                }).then(etaResponse).then(response=>{
                    ifttt.notify(response)
                    console.log(`IFTTT notified...`)
                    return response
                }).then((response) => {
                    resolve(response);
                }).catch(err => {
                    reject(err)
                })
            }
        })
    })
}

var program = require('commander');
program
    .version('0.1')
    .description('a CLI for announcing ETA to your loved one')
    .option('-d, --direction <destination>', 'The direction you intend to travel in')
    .parse(process.argv);

if(program.direction){
    let home = process.env.HOME_ADDRESS;
    let work = process.env.WORK_ADDRESS;
    var from, to;

    if( program.direction == 'home'){
        from = work, to = home;
        console.log('work -> home')
    } else if( program.direction == 'work'){
        from = home, to = work;
        console.log('home -> work')
    } else {
        console.log('not a valid destination')
    }

    requestAndNotifyETA(from, to).then(response=>{
        console.log(`Response sent, ETA process complete ::: ${new Date()}`)
        notifier.notify(response);
    }).catch(err=> {
        console.error(err)
        notifier.notify(err);
    });
}

