
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Declare schema.
const blacklistSchema = Schema({
    token: String
});

//Export the schema as a mongoose model for use.
module.exports = mongoose.model('BlacklistToken', blacklistSchema);