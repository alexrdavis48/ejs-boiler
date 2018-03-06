//Helpers
var hash = require('../helpers/hash');

//Model
var User = require('../models/User');

//Export functions
module.exports = () => {

    //Assess for user presence
    User.find({}, (err, users) => {

        if(users.length == 0) {

            //Add the users and their role to the database.
            User.create(
                [
                    new User({
                        username: 'admin',
                        first: 'Admin',
                        last: 'User',
                        password: hash('Admin343'),
                        email: '',
                        status: true,
                        role: 'Administrator'
                    }),
                    new User({
                        username: 'user',
                        first: 'Basic',
                        last: 'User',
                        password: hash('password'),
                        email: '',
                        status: true,
                        role: 'User'
                    }),
                ],          
            (err, inserted) => {

                if (err) 
                    console.log(err);
                else 
                    console.log(inserted.length + " default users were added.");
            });  
        }
    });

}