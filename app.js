/*
* Main file for the web application (Web API)
* 
* Author : Mantvydas Zakarevičius
* Name : Spotifier
*
* ERROR CODES AVAILABLE TO USE:
* 200	OK - The request has succeeded. The client can read the result of the request in the body and the headers of the response.
* 201	Created - The request has been fulfilled and resulted in a new resource being created.
* 204	No Content - The request has succeeded but returns no message body.
* 400	Bad Request - The request could not be understood by the server due to malformed syntax. The message body will contain more information; see Error Details.
* 401	Unauthorized - The request requires user authentication or, if the request included authorization credentials, authorization has been refused for those credentials.
* 403	Forbidden - The server understood the request, but is refusing to fulfill it.
* 404	Not Found - The requested resource could not be found. This error can be due to a temporary or permanent condition.
* 500	Internal Server Error. You should never receive this error because our clever coders catch them all ... but if you are unlucky enough to get one, please report it to us through a comment at the bottom of this page.
*
* State : L1
*/

// Starting Express
var express = require("express");
// Parser for requests
var bodyParser = require('body-parser');
var app = express().use(bodyParser.json());

// Connect to Mongoose
var mongoose = require("mongoose");
var spotifierDatabase = mongoose.connect("mongodb://localhost/spotifier", {
    useMongoClient: true,
    // Other options
});
// ID validation
var objectID = mongoose.Types.ObjectId;

// Importing used modules
Genre = require("./models/genre");
Song = require("./models/song");
SpotifyAuthorization = require("./modules/spotify_authorization");

// Creating route
app.get("/", function(req, res){
    res.send("Please use /api/genres or /api/songs!");
});

// Genre module functions ---------------------------------
app.get("/api/genres", function(req, res){
    Genre.getGenres(function(err, genres){
        res.setHeader("Content-Type", "application/json");
        if(err){
            res.status(500).send(JSON.stringify(err, null, 3));
        } else {
            res.status(200).send(JSON.stringify(genres, null, 3));
        }
    })
});

app.post("/api/genres", function(req, res){
    var genre = req.body;
    Genre.addGenre(genre, function(err, genre){
        res.setHeader("Content-Type", "application/json");
        if(err){
            res.status(500).send(JSON.stringify(err, null, 3));
        } else {
            res.status(201).send(JSON.stringify(genre, null, 3));
        }
    })
});

app.put("/api/genres/:_id", function(req, res){
    var id = req.params._id;
    var genre = req.body;
    if(objectID.isValid(id)) {
        Genre.updateGenre(id, genre, function(err, genre){
            if(err){
                res.status(500).send(JSON.stringify(err, null, 3));
            } else if (genre == null) {
                res.status(404).send({error: {status: 404, message: "Not found"}});
            } else {
                res.status(204).send();
            }
        });
    } else {
        res.status(400).send({error: {status: 400, message: "Invalid id"}});
    }
});

app.delete("/api/genres/:_id", function(req, res){
    var id = req.params._id;
    if(objectID.isValid(id)) {
        Genre.deleteGenre(id, function(err, genre){
            if(err){
                res.status(500).send(JSON.stringify(err, null, 3));
            } else if (genre.deletedCount == 0) {
                res.status(404).send({error: {status: 404, message: "Not found"}});
            } else {
                res.status(204).send();
            }
        });
    } else {
        res.status(400).send({error: {status: 400, message: "Invalid id"}});
    }    
});
// Genre module functions ---------------------------------

// Song module functions ----------------------------------
app.get("/api/songs", function(req, res){
    Song.getSongs(function(err, songs){
        if(err){
            throw err;
        }
        if(songs == null) {
            res.status(404).send({error: "No songs exist in database!"});
        } else {
            res.setHeader("Content-Type", "application/json");
            res.send(JSON.stringify(songs, null, 3));
        }
    })
});

app.get("/api/songs/:_id", function(req, res, err){
    if(objectID.isValid(req.params._id)) {
        Song.getSongById(req.params._id, function(err, song){
            if(err){
                throw err;
            }
            if(song == null) {
                res.status(404).send({error: "Specified id was not found!"});
            } else {
                res.setHeader("Content-Type", "application/json");
                res.send(JSON.stringify(song, null, 3));
            }
        });
    } else {
        res.status(404).send({error: "Invalid id!"});
    }
});

app.post("/api/songs", function(req, res){
    var song = req.body;
    Song.addSong(song, function(err, song){
        if(err){
            throw err;
        }
        res.status(201).send(song);
    })
});

app.put("/api/songs/:_id", function(req, res){
    var id = req.params._id;
    var song = req.body;
    Song.updateSong(id, song, {new: true}, function(err, song){
        if(err){
            throw err;
        }
        res.send(song);
    })
});

app.delete("/api/songs/:_id", function(req, res){
    var id = req.params._id;
    Song.deleteSong(id, function(err, song){
        if(err){
            throw err;
        }
        res.send(song);
    })
});
// Song module functions ----------------------------------

// Listen to dedicated port for API requests
app.listen(3000);
console.log("Running Spotifier on port: 3000...");