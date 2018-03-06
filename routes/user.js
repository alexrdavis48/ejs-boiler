//Mongoose models used
const mongoose = require('mongoose');
const User = require('../models/User');
const BlacklistToken = require('../models/BlacklistToken.js');

//JSON web token dependency
const jwt = require('jsonwebtoken');

//Helpers
const hash = require('../helpers/hash');
const compareSync = require('../helpers/decrypt');
const tokenAuth = require("../helpers/tokenAuth");
const capString = require("../helpers/capString");
const expiry = require('../config').tokenExpiry;
const userRoles = require('../config').userRoles;

//Function to return current datetime in miliseonds.
let time = () => { return new Date().getTime() };

module.exports = function(app) {

    /* AUTHENTICATE single User */
    // REQUIRES: Username and password JSON Body.
    app.post('/api/user/authenticate-user', (req, res) => {

        //Run MongoDB query 
        User.findOne({ username: req.body.username }).exec( (err, user) => {

            //Send error if there was a query issue
            if (err) 
                res.send({ status: 500, success: false, message: 'Request failed. Please try again!' });
            else {
                //Assess the credentials
                if(!user)
                    res.json({status: 204, success: false, message: 'No user found'});
                else if (user) {

                    //User exists, now compare the passwords by decrypting the database's password record.
                    if(!compareSync(req.body.password, user.password))
                        res.json({status: 401, success: false, message: 'Username and password do not match!'});
                    else if(user.status == false) 
                        res.json({ status: 401, success: false, message: 'User account is disabled.'});     
                    else {
                        //Generate a token to present
                        var token = jwt.sign({ role: user.role.roleTitle, userID: user._id }, app.get('secret'), { expiresIn: expiry });

                        //Send the token to the client.
                        res.send({ success: true, token: token,                            
                            user: { 
                                _id: user._id, 
                                role: user.role,
                                username: user.username,
                                first: user.first,
                                last: user.last,
                                email: user.email,
                                timeLoggedIn: time()
                            } 
                        });
                    }
                }
            }

        });

    });

    /* RERESH a user's token. */
    // REQUIRES: token passed via body, header, or query parameters
    app.post('/api/user/refresh-token', (req, res) => {

        //Find if there was a token that was sent in certain formats.
        let token = req.body.token || req.query.token || req.headers['x-access-token'];

        //Token found
        if(token) {
            //Send the unexpired token to the blacklist collection to prevent authentication using the same token.
            BlacklistToken.create(new BlacklistToken({token: token}), (err, blacklist) => {
                if(err) res.status(500).send({ success: false, message: "There was an error logging out. Did you provide a token to log out with?", error: err });
                else {
                    //Generate a new token to send
                    let newToken = jwt.sign({ role: req.body.user.role, userID: req.body.user._id }, app.get('secret'), { expiresIn: expiry });
                    res.status(200).send({ success: true, token: newToken, timeLoggedIn: time() })
                }
            });        
        }
        else
            res.status(422).send({success: false, message: "No token was sent through the API call"});
    }); 

    /* LOGOUT single user by blacklisting their token. */
    // REQUIRES: token passed via body, header, or query parameters
    app.post('/api/user/logout', (req, res) => {

        //Find if there was a token that was sent in certain formats.
        let token = req.body.token || req.query.token || req.headers['x-access-token'];

        //Token found
        if(token) {

            //Send the token to the blacklist collection to prevent authentication using the same token.
            BlacklistToken.create(new BlacklistToken({token: token}), (err, blacklist) => {
                if(err) 
                    res.status(500).send({ success: false, message: "There was an error processing the token", error: err });
                else
                    res.status(200).send({success: true, message: "Logout success!"});
            });
        }
        
    }); 

    /* GET all Users (authenticated with tokens) */
    // REQUIRES: token passed via body, header, or query parameters
    app.get('/api/user/get-all-users', tokenAuth, (req, res) => {

        //Run MongoDB query 
        User.find().sort({created: -1}).sort({role: 1}).exec( (err, users) => {

            //Send error if there was a query issue
            if (err)
                res.status(500).send({ success: false, message: 'Query failed. Please try again!', error: err});
            else 
                res.status(200).send({ success: true, data: users });
        });

    });

    /* GET a single user for the logged In user to modify. */
    // REQUIRES: userId passed parameter.
    app.get('/api/user/get-user-by-id', tokenAuth, (req, res) => {

        //Run MongoDB query 
        User.findOne({ _id: mongoose.Types.ObjectId(req.query.userId) }, (err, user) => {
            if (err)    
                res.status(500).send({ success: false, message: 'Request failed. Please try again!', error: err});
            else 
                res.status(200).send({ success: true, user: user });
        });

    });

    /* CREATE single User */
    // REQUIRES: User object body
    app.post('/api/user/create-user', tokenAuth, (req, res) => {

        //Assess for username
        User.find( { username: req.body.username } ).exec(function(err, user) {
            
            //No usernames found that match the attempted request.
            if(user.length == 0) {

                var newUser = new User({
                    username: req.body.username,
                    password: hash(req.body.password),
                    first: capString(req.body.first),
                    last: capString(req.body.last),
                    email: req.body.email,
                    status: true,
                    role: req.body.role,
                });

                //Run MongoDB query to insert a new user
                User.create(newUser, function (err, inserted) {
                    if (err) 
                        res.status(500).send({ success: false, message: 'Request failed. Please try again!', error: err});
                    else
                        res.status(200).send({ success: true, message: "User " + inserted.username + " successfully added", userId: inserted._id });               
                });
            }
            else //Send the username exists message
                res.status(409).send({ success: false, message: "Username already exists!"});
        });

    });

    /* UPDATE single User */
    // REQUIRES: User object body
    app.put('/api/user/update-user', tokenAuth, (req, res) => {

        //Assess for username
        User.findOne( { username: req.body.username } ).exec( (err, user) => {
                
            //Username matches requested username change and doesn't match the user id passed.
            if(user != null && user._id != req.body._id)
                res.status(200).send({ success: false, message: "Username already exists!"});
            else {
                 //Run MongoDB query 
                 User.findByIdAndUpdate(req.body._id, {
                    username: req.body.username,
                    first: capString(req.body.first),
                    last: capString(req.body.last),
                    email: req.body.email,
                    phone: req.body.phone,
                    localeCity: capString(req.body.localeCity),
                    localeProvince: capString(req.body.localeProvince),
                }).exec( (err, updated) => {
                    if (err) //Send error if there was a query issue
                        res.status(500).send({ success: false, message: 'Request failed. Please try again!', error: err});  
                    else //Send success message for the update
                        res.status(200).send({ success: true, message: "User " + req.body.username + " successfully updated!"});
                });
            }
        });
    });

    /* UPDATE single User status */
    // REQUIRES: User object body
    app.put('/api/user/update-status', tokenAuth, (req, res) => {

        //Run MongoDB query 
        User.findByIdAndUpdate(req.body._id, {
            status: req.body.status
        }).exec( (err, updated) => {
        
            if (err) //Send error if there was a query issue
                res.status(500).send({ success: false, message: 'Request failed. Please try again!', error: err});            
            else //Send success message for the update
                res.status(200).send({ success: true, message: "Status changes saved for user " + req.body.username});
        });

    });

    /* UPDATE single User Password */
    // REQUIRES: userId and password string sent as JSON Body.
    app.put('/api/user/update-password', tokenAuth, (req, res) => {

        //Run MongoDB query 
        User.findByIdAndUpdate(req.body._id, {
            password: hash(req.body.password)
        }).exec( (err, updated) => {  
            if (err) //Send error if there was a query issue
                res.status(500).send({ success: false, message: 'Request failed. Please try again!', error: err});
            else //Send created user doc
                res.status(200).send({success: true, message: "Password successfully updated!"});
        });
    });

};
