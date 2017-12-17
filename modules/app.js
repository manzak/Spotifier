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
* State : L2
*/

// NodeJS modules imports
var express = require('express'); // Express web server framework
var request = require('request'); // Request library
var querystring = require('querystring'); // QueryString from URL parser
var cookieParser = require('cookie-parser'); // CookieParser module for parsing cookies data
var bodyParser = require('body-parser'); // BodyParser for requests
var morgan = require('morgan'); // Requests debugging

var session = require('express-session');


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
var app = express().use(express.static(__dirname + '/public')).use(cookieParser()).use(bodyParser.json()).use(morgan('dev'));

app.use(session({secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Connects to Mongoose
var mongoose = require("mongoose");
var spotifierDatabase = mongoose.connect("mongodb://localhost/spotifier", {
  useMongoClient: true,
  // Other options
});

// Importing models used from models folder
User = require("../models/user");

// API login call
app.get('/login', function(req, res) {
  if (req.session == User.getUserById(req.session.id, function(err, user){
    // res.setHeader("Content-Type", "application/json");
    if(err){
      console.log("error getting session id");
        // res.status(500).send(JSON.stringify(err, null, 3));
    } else {
      console.log("session_id: ", user);
        // res.status(201).send(JSON.stringify(user, null, 3));
    }
})) {
    return res.redirect('/landing');
    // res.send("logout success!");
  }

  // Cookie data (state)
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  console.log("/login path...");

  // API requests authorization
  var scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});


// // API callback call
app.get('/callback', function(req, res) {
  // API requests refresh and access tokens
  // after checking the state parameter

  console.log("redirected to /callback...");

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

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          // console.log(body);
          
          // Create user
          // app.post("/users", function(req, res){
            // TEMP FOR LOGOUT TESTING ------------------------
            var user = body;
            console.log("post /users");
            User.addUser(user, access_token, refresh_token, req.session.id, function(err, user){
                // res.setHeader("Content-Type", "application/json");
                // if(err){
                //     res.status(500).send(JSON.stringify(err, null, 3));
                // } else {
                //     res.status(201).send(JSON.stringify(user, null, 3));
                // }
            })
            // TEMP FOR LOGOUT TESTING ------------------------
          // });

        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

// API refresh_token call
app.get('/refresh_token', function(req, res) {
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  // Requesting access token from refresh token
  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

// API browse call
// app.get('/', function(req, res) {
//   // res.clearCookie(stateKey);
//   console.log("redirected to /...");
  
//   var code = req.query.code || null;
//   var state = req.query.state || null;
//   var storedState = req.cookies ? req.cookies[stateKey] : null;

//   // If there was an error getting state key cookie (stateKey) (redirect to localhost:8888/# with an error message)
//   if (state === null || state !== storedState) {
//     res.redirect('/#' +
//       querystring.stringify({
//         error: 'state_mismatch'
//       }));
//   // If state key cookie was found (clear cookie and ask for a new one)
//   } else {
//     console.log("redirected to callback aka /browse...");
//     res.redirect('/callback');
//   }
// });

// app.get('/', function (req, res) {
//   res.render('index', {});
// });

// API logout call
// app.get('/logout', function(req, res) {
//   // res.clearCookie(stateKey);
//   // console.log("redirected to /logout...");
  
//   // var code = req.query.code || null;
//   // var state = req.query.state || null;
//   // var storedState = req.cookies ? req.cookies[stateKey] : null;

//   // // If there was an error getting state key cookie (stateKey) (redirect to localhost:8888/# with an error message)
//   // if (state === null || state !== storedState) {
//   //   res.redirect('/#' +
//   //     querystring.stringify({
//   //       error: 'state_mismatch'
//   //     }));
//   // // If state key cookie was found (clear cookie and ask for a new one)
//   // } else {
//   //   console.log("cookie was cleared...");
//   //   // Clear cookie (stateKey)
//   //   res.clearCookie(stateKey);
//   //   res.redirect('/#');
//   // }
//   req.logout();
//   res.redirect('/');
// });

// app.get('/logout', function(req, res){
//   req.logout();
//   res.redirect('/');
// });

// Authentication and Authorization Middleware
var auth = function(req, res, next) {
  if (req.session && req.session.id)
    return next();
  else
    return res.sendStatus(401);
};

app.get('/logout',function(req, res){
  // req.session.destroy(function(){
  //   res.redirect('/');
  // });
    if (req.session) {
    req.session.destroy();
    res.redirect('/');
    // res.send("logout success!");
  } else {
    res.redirect('/');
    // res.send("Session already has been destroyed!");
  }
}); 

app.get('/test-function', auth, function (req, res) {
      res.send("You can only see this after you've logged in.");
  // console.log("test-function: ");

  // console.log(req.sessionID);
});

// Listens to 8888 port on local server
app.listen(8888);
console.log('Listening on 8888');

//[START] - ALL CODE WHICH IS FOR TESTING OR NOT YET IMPLEMENTED

//[SESSION_MIDDLEWARE_START]----------------------------------------

// SESSION CODE -------------------------------------------------------------------------
// var session = require('express-session'); // SESSION

// .use(session({
//   secret: '2C44-4D44-WppQ38S',
//   resave: true,
//   saveUninitialized: true
// }))

// Authentication and Authorization Middleware
// var auth = function(req, res, next) {
//   if (req.session && req.session.user === "amy" && req.session.admin)
//     return next();
//   else
//     return res.sendStatus(401);
// };
 
// // Login endpoint
// app.get('/login', function (req, res) {
//   if (!req.query.username || !req.query.password) {
//     res.send('login failed');    
//   } else if(req.query.username === "amy" || req.query.password === "amyspassword") {
//     req.session.user = "amy";
//     req.session.admin = true;
//     res.send("login success!");
//   }
// });
 
// // Logout endpoint
// app.get('/logout', function (req, res) {
//   if (req.session) {
//     req.session.destroy();
//     res.send("logout success!");
//   } else {
//     res.send("Session already has been destroyed!");
//   }

// });
 
// // Get content endpoint
// app.get('/content', auth, function (req, res) {
//     res.send("You can only see this after you've logged in.");
// });
// SESSION CODE -------------------------------------------------------------------------

//[SESSION_MIDDLEWARE_START_END]----------------------------------------

//[END]