require('dotenv').config();
var request = require('request');

module.exports.notify = (eta) => {
    let etaObject = {
        value1: eta
    };
    return new Promise((resolve, reject)=>{
        request({
            url: process.env.IFTTT_POST_URL,
            method: "POST",
            json: true,
            body: etaObject
        }, (err, response, body) =>{
            if(err){
                console.error(err);
                reject(err);
            } else {
                console.log(response);
                resolve(response)
            }
        });
    })
}
