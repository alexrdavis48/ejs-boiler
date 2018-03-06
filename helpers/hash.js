
const bcrypt = require('bcrypt-nodejs');

//Reusable function to generate hash for user password when it is saved to the database
module.exports = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};