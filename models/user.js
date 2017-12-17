/*
* User module.
* 
* Author : Mantvydas Zakarevičius
* Name : Spotifier
*
* State : L2-L3
*/

// Imports
var mongoose = require('mongoose');

// USER schema
var userSchema = mongoose.Schema({
    user_id: {
        type: String,
        required: true,
        unique : true
    },
    access_token: {
        type: String,
        required: true
    },
    refresh_token: {
        type: String,
        required: true
    },
    session_id: {
        type: String,
        required: true
    },
    create_date: {
        type: Date,
        default: Date.now
    }
});
// USER model
var User = module.exports = mongoose.model("users", userSchema);

/* 
* ADD User.
* 
* Adds new user from formatted JSON.
*
* user - formatted user JSON to add to database.
* access_token - access_token.
* refresh_token - refresh_token.
* session_id - session_id.
* return - JSON formatted new user with all fields.
*/
module.exports.addUser = function(user, access_token, refresh_token, session_id, callback) {
    User.findOneAndUpdate(
        { user_id: user.id },
        { user_id: user.id, session_id: session_id, access_token: access_token, refresh_token: refresh_token, create_date: Date.now() },
        { upsert: true, new: true },
        callback
    );
}

/* 
* GET User.
* 
* Gets new user by session_id (for session validation).
*
* session_id - session_id.
* return - JSON formatted new user with all fields.
*/
module.exports.getUserById = function(session_id, callback) {
    User.findOne({session_id: session_id}, callback);
}