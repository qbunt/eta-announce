require('dotenv').config();
var request = require('request');

module.exports.notify = (topic='eta', value) => {
    return new Promise((resolve, reject)=>{
        request({
            url: process.env.IFTTT_POST_URL.replace('{{TOPIC}}', topic),
            method: "POST",
            json: true,
            body: {value1: value}
        }, (err, response, body) =>{
            if(err){
                reject(err);
            } else {
                resolve(response)
            }
        });
    })
}
