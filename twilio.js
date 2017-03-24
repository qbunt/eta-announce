require('dotenv').config()
var client = require('twilio')(process.env.TWILIO_TEST_SID, process.env.TWILIO_TEST_TOKEN);

module.exports.sendSms = (to, message) => {
    client.messages.create({
        body: message,
        to: to,
        from: process.env.TWILIO_PHONE
    }, (err, data) =>{
        if (err) {
            console.error('Could not notify administrator');
            console.error(err);
        } else {
            console.log('Administrator notified');
        }
    });
};
