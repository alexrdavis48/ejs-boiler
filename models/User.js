
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Declare schema.
const userSchema = Schema({
    username: String,
    password: String,
    email: String,
    first: String,
    last: String,
    status: Boolean,
    role: String,
    created: { type: Number, default: function(){return new Date().getTime()} },
});

//Export the schema as a mongoose model for use.
module.exports = mongoose.model('User', userSchema);