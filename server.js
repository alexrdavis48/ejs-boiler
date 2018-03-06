
/******* Modules to load */

const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const glob = require('glob');
//const cors = require('cors');
const cron = require('cron');

const config = require('./config');
const seedData = require('./helpers/seedData');
const blacklistClean = require('./helpers/blacklistClean');

/************************/

//Set a port number to start server on
const app = express();
const port = process.env.PORT || 3000;

//Connect to the database
//MongoDB Connection with promise injection.
mongoose.connect(config.url, config.dbConfig, (err) => {
    if(err) 
        console.log(err.message);
    else {
        console.log("Connected Successfully to " + config.url);  
        seedData(); //If there are no users or roles created, run the seedData file's exported function.
    }
});

//Set session secret for JWT token to use when generating new tokens for authenticated users.
app.set('secret', config.secret); 

//Use JSON requirements for POST, PUT, DELETE request body objects.
app.unsubscribe(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//Override requests with X-HTTP-Method
app.use(methodOverride('X-HTTP-Method-Override'));

// use morgan to log request traffic to the console
app.use(morgan('dev'));

//Set static / client directory / landing page when navigating to URL.
app.use(express.static(__dirname + '/public'));

//Allow for cross origin requests
app.use( (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// OLD - app.use(cors());

/************* Routes *************/

//Load api route files using glob module.
//glob.sync function will loop through the directory's files and inject them here.
glob.sync('./routes/**/*.js').forEach( (file) => { require(file)(app); });

//Direct server to load index.html in client for front-end libraries to load on navigating to URL.
app.get('/*', function(req, res) { res.sendFile(__dirname + '/public/index.html'); });

/*********************************/

//Set clean up task for the blacklist collection.
//Currently: Every Sunday at 4:00AM
cron.job('0 4 * * 0', () => { blacklistClean(); }).start();

//Start HTTP server on the port specified.
const server = http.createServer(app).listen(port, () => { console.log('Server opened at: http://localhost:' + port); });               

//Expose app to our API routes.          
exports = module.exports = app;


