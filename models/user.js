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
    rated_elements_count: {
        type: Number,
        default: 0,
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
        { user_id: user.id, session_id: session_id, access_token: access_token, refresh_token: refresh_token, rated_elements_count: 0, create_date: Date.now() },
        { upsert: true, new: true },
        callback
    );
}

/* 
* DELETE user.
* 
* Deletes existing user if found from formatted JSON by access_token.
*
* return - returns deleted user object
*/
module.exports.deleteUser = function(access_token, callback){
    User.deleteOne(
        { access_token: access_token },
        callback
    );
}

/* 
* GET user.
* 
* Gets existing user if found from formatted JSON by access_token.
*
* return - returns existing user object
*/
module.exports.getUserById = function(access_token, callback){
    console.log(access_token);
    User.findOne(
        { access_token: access_token },
        callback
    );
}

/* 
* UPDATE user.
* 
* Updates user if exist from formatted JSON.
*
* return - JSON formatted updated user with all fields.
*/
module.exports.updateUser = function(id, user, callback){
    User.findOneAndUpdate(
        { user_id: id },
        { session_id: user.session_id, access_token: user.access_token, refresh_token: user.refresh_token, rated_elements_count: user.rated_elements_count },
        { new: true },
        callback
    );
}