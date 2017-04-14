require('dotenv').config();
var somebodyElsesComputer = require("find-apple-device");

var email = process.env.ICLOUD_USER;
var password = process.env.ICLOUD_PASS;

var iCloud = new somebodyElsesComputer(email, password);

module.exports.notify = (deviceID, message) => {
    return new Promise((resolve, reject) => {
        iCloud.getDevices((err, devices) => {
            if (err){
                reject(err);
            }
            if (devices.length === 0) {
                return console.log("No devices found!");
            }
            iCloud.alertDevice(deviceID, message, function(err) {
                if (err) {
                    reject(err);
                }
                console.log("Successfully alerted device!");
                resolve(deviceID);
            });
        });
    })
}
