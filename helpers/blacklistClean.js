//Mongoose blacklisted token model
BlacklistToken = require('../models/BlacklistToken');

module.exports = () => {

    BlacklistToken.remove({}, (err, removed) => {
        if(err) console.log(err);
        else console.log("Scheduled Blacklist collection clean-up completed on: " + new Date().toLocaleString());
    });

};

