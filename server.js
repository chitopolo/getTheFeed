    var express = require('express');
    var Promise = require("bluebird");
    var _ = require('underscore');
    var graph     = Promise.promisifyAll(require('fbgraph')); // con promise
    var config = require('./config');

    var qs = require('querystring');
    var path = require('path');
    var async = require('async');
    var bcrypt = require('bcryptjs');
    var bodyParser = require('body-parser');
    var jwt = require('jwt-simple');
    var moment = require('moment');
    var logger = require('morgan');
    var request = require('request');
    var Parse = require('node-parse-api').Parse;
    var Kaiseki = require('kaiseki');
    //parse
    var APP_ID = 'vcfeVvTehZWbpylpqaJvbUOSFNO0lEBHlWjiW7iq';
    var REST_API_KEY = 'IXVRwkbl2QvPtikOhlMoalW2xgWlH6hGm9dMaXAK';
    var appdata = new Kaiseki(APP_ID, REST_API_KEY);

    var conf = {
      client_id:      '749963285077786'
      , client_secret:  '82bade0323a95e982e90805ba8c698dc'
      , scope:          'email, user_about_me, user_birthday, user_location, publish_stream, user_groups'
      , redirect_uri:   'http://localhost:3000/auth/facebook'
    };


    var app = express();

    app.set('port', process.env.PORT || 3000);
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.use(express.static(path.join(__dirname, '/public')));

    /*
    |--------------------------------------------------------------------------
    | Login Required Middleware
    |--------------------------------------------------------------------------
    */
    function ensureAuthenticated(req, res, next) {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'Please make sure your request has an Authorization header' });
      }
      var token = req.headers.authorization.split(' ')[1];
      var payload = jwt.decode(token, config.TOKEN_SECRET);
      if (payload.exp <= moment().unix()) {
        return res.status(401).send({ message: 'Token has expired' });
      }
      req.user = payload.sub;
      next();
    }

    /*
    |--------------------------------------------------------------------------
    | Generate JSON Web Token
    |--------------------------------------------------------------------------
    */
    function createToken(user) {
      var payload = {
        sub: user._id,
        iat: moment().unix(),
        exp: moment().add(14, 'days').unix()
      };
      return jwt.encode(payload, config.TOKEN_SECRET);
    }

    /*
    |--------------------------------------------------------------------------
    | GET /api/me
    |--------------------------------------------------------------------------
    */
    app.get('/api/me', ensureAuthenticated, function(req, res) {

      appdata.getObjects('User', req.user, function(err, user, body, success) {
        console.log('user info = ', body);
        res.send(user)
      });
    });

    /*
    |--------------------------------------------------------------------------
    | PUT /api/me
    |--------------------------------------------------------------------------
    */
    app.put('/api/me', ensureAuthenticated, function(req, res) {

    // appdata.find('User', req.user, function (err, user) {
      appdata.getObjects('User', req.user, function(err, user, body, success) {
        if (!user) {
          return res.status(400).send({ message: 'User not found' });
        }
        user.displayName = req.body.displayName || user.displayName;
        user.email = req.body.email || user.email;

        appdata.createObject('User', user, function(err, response, body, success) {
          console.log('response 3b: ', response);
          if(!err){
            console.log(response);
            res.status(200).end();
          }else{
            console.log('error '+ err);
          }
        });
      });
    });

    /*
    |--------------------------------------------------------------------------
    | Login with Facebook
    |--------------------------------------------------------------------------
    */
    app.post('/auth/facebook', function(req, res) {
      var accessTokenUrl = 'https://graph.facebook.com/oauth/access_token';
      var graphApiUrl = 'https://graph.facebook.com/me';
      var params = {
        code: req.body.code,
        client_id: req.body.clientId,
        scope: req.body.scope,
        client_secret: config.FACEBOOK_SECRET,
        redirect_uri: req.body.redirectUri
      };

    // Step 1. Exchange authorization code for access token.
    request.get({ url: accessTokenUrl, qs: params, json: true }, function(err, response, accessToken) {
      if (response.statusCode !== 200) {
        return res.status(500).send({ message: accessToken.error.message });
      }
      accessToken = qs.parse(accessToken);
      console.log('this is the access Token: ', accessToken)

    // Step 2. Retrieve profile information about the current user.
    request.get({ url: graphApiUrl, qs: accessToken, json: true }, function(err, response, profile) {
      if (response.statusCode !== 200) {
        return res.status(500).send({ message: profile.error.message });
      }
      console.log('profile: ', profile);
    // console.log('req.headers.authorization : ' , req.headers);

    if(req.headers.authorization) {
      console.log('inside of the req.headers.authorization');
      appdata.getObjects('User', { facebook: profile.id }, function(err, existingUser, body, success) {
    // appdata.find('User', { facebook: profile.id }, function (err, existingUser) {
      if (existingUser) {
        return res.status(409).send({ message: 'There is already a Facebook account that belongs to you' });
      }
      var token = req.headers.authorization.split(' ')[1];
      var payload = jwt.decode(token, config.TOKEN_SECRET);
    // appdata.find('User', payload.sub, function (err, user) {
      console.log('this is the payload ', payload);
      appdata.getObjects('User', payload.sub, function(err, user, body, success) {

        if (!user) {
          return res.status(400).send({ message: 'User not found' });
        }
        user.facebook = profile.id;
        user.displayName = user.displayName || profile.name;
        user.email = profile.email || '';
        user.location = profile.location.name || '';
        user.bio = profile.bio || '';
        console.log('This is the FB payload: ', profile);
        appdata.createObject('User', user, function(err, response, body, success) {
          console.log('response 3b: ', response);
          if(!err){
            var token = createToken(user);
            res.send({ token: token, fbtoken: accessToken.access_token });
          }else{
            console.log('error '+ err);
          }
        });
      });
    });
  } else {
    // Step 3b. Create a new user account or return an existing one.
    console.log('inside of the else');
    var params = { 
      facebook: profile.id 
    }
    appdata.getObjects('User', params, function(err, resp, existingUser, success) {
    // appdata.find('User', { facebook: profile.id }, function (err, existingUser) {
      console.log('existing USER success: ', success, ' body: ', existingUser);
      if (existingUser.length === 1) {
        var token = createToken(existingUser);
        return res.send({ token: token , fbtoken: accessToken.access_token});
      }
      var user = {};
      user.facebook = profile.id;
      user.displayName = profile.name;
      user.email = profile.email || '';
      user.location = profile.location || '';
      user.bio = profile.bio || '';
      console.log('user being created: ', user);
    // appdata.insertCustom('users', user, function(err, response) {
      appdata.createObject('User', user, function(err, response, body, success) {
        // console.log('response 3b: ', response);
        if(!err){
          var token = createToken(user);
          res.send({ token: token , fbtoken: accessToken.access_token});
        }else{
          console.log('error '+ err);
        }
      });
    });
  }
})})});

    app.get('/auth/getthefeed/:token', function(req, res2){
      console.log('llego a getthefeed');
      var count = 0;
      var theResult = [];
      var  _theToken = req.params.token
      var  fbToken = req.params.token

      console.log('this is the token: '+ _theToken);
      var getFacebookGraphData = function(theData,  _theToken){
        theData = theData || '257373200968071/feed';
        _theToken = _theToken || {access_token: fbToken};

        graph.getAsync(theData, _theToken)
    .then(function(res){
    console.log('llego dentro del then');
    if(count<5){
       count++;
      // console.log('OTRO DATA SET ----------------------------- ' , res.data);
      theResult.push(res.data);
      // console.log('vuelta numero: '+ count + 'resultado en ' + res.paging.next);
      if(res.paging && res.paging.next) {
        getFacebookGraphData(res.paging.next, null);
      }
    }
    return theResult;
    })
    .then(function(results){
    // eventEmitter.emit('pageLoaded', res2, results);
    // console.log(results)
    console.log('EL COUNT FUE DE ' + count);
    if(count === 5){
    // res2.render('feed', { res: _.flatten(results) });
    res2.json(_.flatten(results))
    }
  })
        .catch(function(e){
          console.error("Error: ", e);
        });
      };

      console.log('llamando a la funcion');
      getFacebookGraphData();
    });



    app.listen(app.get('port'), function() {
      console.log('Express server listening on port ' + app.get('port'));
    });