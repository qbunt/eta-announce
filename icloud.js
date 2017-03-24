require('dotenv').config();
var somebodyElsesComputer = require("find-apple-device");

var email = process.env.ICLOUD_USER;
var password = process.env.ICLOUD_PASS;

var iCloud = new somebodyElsesComputer(email, password);
var noop = ()=>{};

module.exports.notify = (deviceID, message, callback) => {
    callback = callback || noop;
    iCloud.getDevices((err, devices) => {
        if (err){
            return console.error('Error',err);
            // throw err;
        }
        if (devices.length === 0) {
            return console.log("No devices found!");
        }
        iCloud.alertDevice(deviceID, message, function(err) {
            if (err) {
                return console.error(err);
            }
            console.log("Successfully alerted device!");
            callback(deviceID);
        });
    });    
}


