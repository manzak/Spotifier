var mongoose = require('mongoose');

// SONG_RATE Schema
var songRateSchema = mongoose.Schema({
    user_id: {
        type: String,
        required: true,
        unique : true
    },
    song_id: {
        type: String,
        required: true,
        unique : true
    },
    value: {
        type: Number,
        default: 0
    },
    create_date: {
        type: Date,
        default: Date.now
    }
});
// SONG_RATE model
var SongRate = module.exports = mongoose.model("song_rates", songRateSchema);