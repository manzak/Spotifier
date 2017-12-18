/*
* Main file for the web application (Web API)
* 
* Author : Mantvydas Zakarevičius
* Name : Spotifier
*
* ERROR CODES AVAILABLE TO USE:
*   200	OK - The request has succeeded. The client can read the result of the request in the body and the headers of the response.
*   201	Created - The request has been fulfilled and resulted in a new resource being created.
*   204	No Content - The request has succeeded but returns no message body.
*   400	Bad Request - The request could not be understood by the server due to malformed syntax. The message body will contain more information; see Error Details.
*   401	Unauthorized - The request requires user authentication or, if the request included authorization credentials, authorization has been refused for those credentials.
*   403	Forbidden - The server understood the request, but is refusing to fulfill it.
*   404	Not Found - The requested resource could not be found. This error can be due to a temporary or permanent condition.
*   500	Internal Server Error. You should never receive this error because our clever coders catch them all ... but if you are unlucky enough to get one, please report it to us through a comment at the bottom of this page.
*
* PERFORMS SPOTIFY AUTHORIZATION CODE OAUTH2 FLOW TO AUTHENTICATE AGAINST SPOTIFY ACCOUNTS:
*   For more information, read
*   https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
*
* State : L2-L3
*/

// NodeJS modules imports
var express = require('express'); // Express web server framework
var session = require('express-session'); // Express session module
var request = require('request'); // Request library
var querystring = require('querystring'); // QueryString from URL parser
var cookieParser = require('cookie-parser'); // CookieParser module for parsing cookies data
var bodyParser = require('body-parser'); // BodyParser for requests
var morgan = require('morgan'); // Requests debugging

/* 
* Spotify dashboard API connection data (PRIVATE ONLY FOR BACK-END)
*/
var client_id = '0adb20d41c9540acb1ba0985e7274c21'; // CLIENT_ID
var client_secret = '13321b49a8894025aea91f52f8470a0f'; // SECRET
var redirect_uri = 'http://localhost:8888/callback'; // REDIRECT_URI
// Cookie state key (stateKey)
var stateKey = 'spotify_auth_state';

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

// Starts Express
var app = express()
        .use(express.static(__dirname + '/public'))
        .use(cookieParser())
        .use(bodyParser.json())
        .use(morgan('dev'))
        .use(session({secret: client_id, resave: false, saveUninitialized: true}));

// Connects to Mongoose
var mongoose = require("mongoose");
var spotifierDatabase = mongoose.connect("mongodb://localhost/spotifier", {
  useMongoClient: true,
  // Other options
});

// Importing models used from models folder
User = require("../models/user");
Genre = require("../models/genre");

/* 
* LOGIN app.
* 
* Logins user to app and creates user if it's new user.
*/
app.get('/login', function(req, res) {
  // Cookie data (state)
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // API requests authorization
  var scope = 'user-read-private user-read-email user-library-read';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

/* 
* CALLBACK app.
* 
* Callback to (localhost:8888/callback).
*/
app.get('/callback', function(req, res) {
  // API requests refresh and access tokens (after checking the state parameter)
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  // If there was an error getting state key cookie (stateKey) (redirect to localhost:8888/# with an error message)
  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  // If state key cookie was found (clear cookie and ask for a new one)
  } else {
    // Clear cookie (stateKey)
    res.clearCookie(stateKey);

    // Authorization options
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    // API requests authorization
    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        // Authorization parameters
        var access_token = body.access_token,
            refresh_token = body.refresh_token;
        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // Use the access token to access the Spotify Web API (https://api.spotify.com/v1/me)
        request.get(options, function(error, response, body) {
          User.addUser(body, access_token, refresh_token, req.session.id, function(err, user){
            console.log("User has been modified!");
          });
        });

        // Sets cookies and redirect to main menu
        req.session.access_token = access_token;
        req.session.refresh_token = refresh_token;
        res.cookie('access_token', req.session.access_token);
        res.cookie('refresh_token', req.session.refresh_token);
        res.redirect('/');
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

/* 
* LOGOUT app.
* 
* Logout user from current session and redirect to main page.
*/
app.get('/logout', function(req, res) {
  if (req.session || req.session.access_token) {
    console.log("Session has been destroyed.");
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    req.session.destroy();
    res.redirect('/');
  } else {
    console.log("Session already has been destroyed!");
    res.redirect('/');
  }
});

/* 
* API.
* 
* Shows basic API information.
*/
app.get('/api', function(req, res) {
  // if (req.cookies) {
    if (req.session.access_token) {
      res.status(200).send({status: 200, token: req.session.access_token});
    } else {
      res.status(403).send({error: {status: 403, message: "Invalid token. Access denied!"}});
    }
  // } else {
  //   res.redirect('/login');
  // }
});

/* 
* Router middleware.
* 
* Checks authorization before granting API usage.
*/
// app.use(function(req, res, next) {
//   if (!req.headers.authorization) {
//     return res.status(403).json({ error: 'No credentials sent!' });
//   } 
//   // else if (req.headers.authorization != req.session.access_token) {
//   //   return res.status(401).json({ error: 'Access denied!' });
//   // }
//     console.log(User.findById({access_token: req}));

//   next();
// });

/* 
* API/GENRES.
* 
* Shows genres list.
*/
app.get("/api/genres", function(req, res){
  // if (req.session.access_token) {
    Genre.getGenres(req.session.access_token, function(err, genres){
      res.setHeader("Content-Type", "application/json");
      if(err){
          res.status(500).send(JSON.stringify(err, null, 3));
      } else {
          res.status(200).send(JSON.stringify(genres, null, 3));
      }
    })
  // } else {
  //   res.status(403).send({error: {status: 403, message: "Invalid token. Access denied!"}});
  // }
});

/* 
* API/USERS.
* 
* Deletes an user.
*/
app.delete("/api/users/:_id", function(req, res){
  var id = req.params._id;
  console.log(id);
    User.deleteUser(id, function(err, user){
        if(err){
            res.status(500).send(JSON.stringify(err, null, 3));
        } else if (user.deletedCount == 0) {
            res.status(404).send({error: {status: 404, message: "Not found"}});
        } else {
            res.status(204).send();
        }
    });
});

/* 
* API/USERS.
* 
* Gets an user.
*/
app.get("/api/users/:_id", function(req, res){
  var id = req.params._id;
  User.getUserById(id, function(err, user){
    res.setHeader("Content-Type", "application/json");
    if(err){
        res.status(500).send(JSON.stringify(err, null, 3));
    } else if (user == null) {
        res.status(404).send({error: {status: 404, message: "Not found"}});
    } else {
        res.status(200).send(JSON.stringify(user, null, 3));
    }
  })
});

// Listens to 8888 port on local server
app.listen(8888);
console.log('Listening on 8888...');