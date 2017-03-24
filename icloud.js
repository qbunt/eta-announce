require('dotenv').config();
var ICloud = require("find-apple-device");

var email = process.env.ICLOUD_USER;
var password = process.env.ICLOUD_PASS;

var iCloud = new ICloud(email, password);

module.exports.notifyIcloud = (deviceID, callback) => {
    iCloud.getDevices(function(err, devices) {
        if (err){
            return console.error('Error',err);
            throw err;
        }
        if (devices.length === 0) {
            return console.log("No devices found!");
        }
        iCloud.alertDevice(deviceID, "This is a test alert!", function(err) {
            if (err) {
                return console.error(err);
            }
            console.log("Successfully alerted device!");
            callback(deviceID);
        });
    });    
}


