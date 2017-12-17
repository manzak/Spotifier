/*
* User module.
* 
* Author : Mantvydas Zakarevičius
* Name : Spotifier
*
* State : L2
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
* return - JSON formatted new user with all fields.
*/
module.exports.addUser = function(user, access_token, refresh_token, session_id, callback){
    console.log("ADD USER!\n", user);
    User.findOneAndUpdate(
        { user_id: user.id },
        { user_id: user.id, session_id: session_id, access_token: access_token, refresh_token: refresh_token, create_date: Date.now() },
        { upsert: true, new: true },
        callback
    );
}

// Get User
module.exports.getUserById = function(id, callback){
    User.findOne({session_id: id}, callback);
}