require('dotenv').config()
var client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

module.exports.notify = (to, message, callback) => {
    callback = callback || function(){};
    client.messages.create({
        body: message,
        to: to,
        from: process.env.TWILIO_PHONE
    }, (err, data) =>{
        if (err) {
            console.error('Could not notify administrator');
            console.error(err);
        } else {
            callback(data)
        }
    });
};
