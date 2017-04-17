require('dotenv').config()
var client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

module.exports.notify = (to, message) => {
    if(process.env.TWILIO_SID !== undefined && process.env.TWILIO_TOKEN !== undefined){
        Promise.reject(console.error('missing required twilio parameters'))
    }
    return new Promise((resolve, reject)=>{
        client.messages.create({body: message,
            to: to,
            from: process.env.TWILIO_PHONE
        }, (err, data) =>{
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        });    
    })
};
