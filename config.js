module.exports = {

    //MongoDB Connection (default localhost)
    //Ensure Mongo Daemon is running on your machine if using local conenction.
    url:'mongodb://localhost:27017/ejs-boiler',

    //Db config. 
    dbConfig: { 
        autoReconnect: true,  
        reconnectTries: 30, 
        promiseLibrary: require('bluebird') 
    },

    //Secret that gets passed to assemble JWTs.
    secret: 'Oranges343',

    //JWT token expiration (DEFAULT here 3 days)
    tokenExpiry: 259200,

    //Default user roles. 
    userRoles: [
        'Administrator',
        'User'
    ]
    
}