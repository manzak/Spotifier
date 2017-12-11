/*
* User module.
* 
* Author : Mantvydas Zakarevičius
* Name : Spotifier
*
* State : L1
*/

// Imports
var mongoose = require('mongoose');

// GENRE schema
var userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique : true
    },
    create_date: {
        type: Date,
        default: Date.now
    }
});