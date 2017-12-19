var mongoose = require('mongoose');

// SONG Schema
var songSchema = mongoose.Schema({
    song_id: {
        type: String,
        required: true,
        unique : true
    },
    rate_count: {
        type: Number,
        default: 0
    },
    rate_value: {
        type: Number,
        default: 0
    },
    rate_average: {
        type: Number,
        default: 0
    },
    create_date: {
        type: Date,
        default: Date.now
    }
});
// SONG model
var Song = module.exports = mongoose.model("song", songSchema);