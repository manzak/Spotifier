/*
* Genre module.
* 
* Author : Mantvydas Zakarevičius
* Name : Spotifier
*
* State : L1
*/

// Imports
var mongoose = require('mongoose');

// GENRE schema
var genreSchema = mongoose.Schema({
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
// GENRE model
var Genre = module.exports = mongoose.model("genres", genreSchema);

/* 
* GET genres.
* 
* Gets all genres list.
*
* limit - limits results amount.
* return - JSON formatted genres list with all fields.
*/
module.exports.getGenres = function(callback, limit){
    Genre.find(callback).limit(limit);
}

/* 
* ADD Genre.
* 
* Adds new genre from formatted JSON.
*
* genre - formatted genre JSON to add to database.
* return - JSON formatted new genre with all fields.
*/
module.exports.addGenre = function(genre, callback){
    Genre.findOneAndUpdate(
        { name: genre.name },
        { name: genre.name, create_date: Date.now() },
        { upsert: true, new: true },
        callback
    );
}

/* 
* UPDATE genre.
* 
* Updates genre if exist from formatted JSON.
*
* return - JSON formatted updated genre with all fields.
*/
module.exports.updateGenre = function(id, genre, callback){
    // var query = {
    //     _id: id
    // };
    // var update = {
    //     name: genre.name
    // };
    // var options = {
    //     new: true
    // };
    // Genre.findOneAndUpdate(query, update, options, callback);
    Genre.findOneAndUpdate(
        { _id: id },
        { name: genre.name },
        { new: true },
        callback
    );
}

/* 
* DELETE genre.
* 
* Deletes existing genre if found from formatted JSON by id.
*
* return - returns deleted genre JSON?
*/
module.exports.deleteGenre = function(id, callback){
    Genre.deleteOne(
        { _id: id },
        callback
    );
}