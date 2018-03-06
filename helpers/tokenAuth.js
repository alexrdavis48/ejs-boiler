//JWT requires
const jwt = require('jsonwebtoken');
const secret = require('../config').secret;

//Mongoose blacklisted token model
BlacklistToken = require('../models/BlacklistToken');

module.exports = (req, res, next) => {

    //Find if there was a token that was sent in certain formats.
    let token = req.body.token || req.query.token || req.headers['x-access-token'];
    
    //Token exists, now decode it to authenticate the request.
    if (token) {
    
        jwt.verify(token, secret, (error, decoded) => {
            
            //Token failed authentication
            if (error) 
                return res.status(500).send({ success: false, message: 'There was an error processing the request.', error: error });    
            else { //Token is valid, now assess if it is blacklisted. If so, that means user is logged out.

                //Assess if there is a blacklist token that matches the user provided token.
                BlacklistToken.findOne({"token": token}).exec( (err, t) => {
                    if(err)
                        return res.status(500).send({ success: false, message: 'There was an error processing the request.', error: err });

                    if( t == null) {
                        //On auth success, assign the token to locals for use in the route that tokenAuth is passed through.
                        //Use the locals to find the current UserID and their Role without through token assessment rather than running to the Database
                        res.locals.token = decoded;
                        next(); 
                    }
                    else //Entry found in the blacklist - token fails authentication.
                        return res.status(401).send({ success: false, message: 'Failed to authenticate token. It is blacklisted' });
                });                    
            }
        });
    } 
    else 
        return res.status(403).send({ success: false, message: 'No token provided.' }); // Notify as a forbidden request when no token presented.
}