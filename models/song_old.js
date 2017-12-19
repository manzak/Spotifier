var mongoose = require('mongoose');

// Song Schema
var songSchema = mongoose.Schema({
    artists: [{
        type: String,
        required: true
    }],
    name: {
        type: String,
        required: true
    },
    href: {
        type: String
    },
    preview_url: {
        type: String
    },
    genres: [{
        type: String
    }],
    rating: {
        type: Number
    },
    image_url: {
        type: String
    },
    create_date: {
        type: Date,
        default: Date.now
    }
});

var Song = module.exports = mongoose.model("Song", songSchema);

// Get Songs
module.exports.getSongs = function(callback, limit){
    Song.find(callback).limit(limit);
}

// Get Song
module.exports.getSongById = function(id, callback){
    Song.findById(id, callback);
}

// Add Song
module.exports.addSong = function(song, callback){
    Song.create(song, callback);
}

// Update Song
module.exports.updateSong = function(id, song, options, callback){
    var query = {
        _id: id
    };
    var update = {
        artists: song.artists,
        name: song.name,
        href: song.href,
        preview_url: song.preview_url,
        genres: song.genres,
        rating: song.rating,
        image_url: song.image_url
    };
    Song.findOneAndUpdate(query, update, options, callback);
}

// Delete Song
module.exports.deleteSong = function(id, callback){
    var query = {
        _id: id
    };
    Song.remove(query, callback);
}