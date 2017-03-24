require('dotenv').config();

module.exports.notify = (eta) => {
    let etaObject = {
        value1: eta
    };
    request({
        url: process.env.IFTTT_POST_URL,
        method: "POST",
        json: true,
        body: etaObject
    }, (error, response, body) =>{
        if(error){
            console.error(error)
        } else {
            console.log(response);
        }
    });
}
