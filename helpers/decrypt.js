
const bcrypt = require('bcrypt-nodejs');

//Reusable function to decrypt hash for user password when assessing login procedure
module.exports = (password, userPassword) => {
    return bcrypt.compareSync(password, userPassword);
};