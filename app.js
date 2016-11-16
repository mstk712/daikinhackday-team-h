/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------
'use strict';

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express'), 
    bodyParser = require('body-parser'); 

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// ToneAnalyzer Settings.
var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');

var tone_analyzer = new ToneAnalyzerV3({
  username: 'c3666c10-56e0-41c0-9f3b-35e319373185',
  password: 'DH0M1yqC4S75',
  version_date: '2016-05-19'
});

// create a new express server
var app = express();
var request = require('request');

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// Application end point
app.post('/api/tone', function(req, res, next){
  console.log(req);
  tone_analyzer.tone(req.body,
    function(err, tone) {
      if (err)
        return next(err);
      else
        //console.log(JSON.stringify(tone, null, 2));
        res.status(200).json(tone);
  });
});

// DAIKIN.AC-Control

var preset = {
  init:{
    "status": {
      "power": 1,
      "operation_mode": 1,
      "set_temperature": 28,
      "fan_speed": 1,
      "fan_direction": 3
    }
  },
  deinit:{
    "status": {
      "power": 0,
      "operation_mode": 1,
      "set_temperature": 28,
      "fan_speed": 1,
      "fan_direction": 3
    }
  }
};
preset.anger = {
  "status": {
    "power": 1,
    "operation_mode": 4,
    "set_temperature": preset.init.status.set_temperature - 3,
    "fan_speed": 2,
    "fan_direction": 1
  }
};
preset.disgust = {
  "status": {
    "power": 1,
    "operation_mode": 1,
    "set_temperature": preset.init.status.set_temperature - 1,
    "fan_speed": 0,
    "fan_direction": 3
  }
};
preset.fear = {
  "status": {
    "power": 1,
    "operation_mode": 1,
    "set_temperature": preset.init.status.set_temperature - 2,
    "fan_speed": preset.init.status.fan_speed,
    "fan_direction": 2
  }
};
preset.joy = {
  "status": {
    "power": 1,
    "operation_mode": 1,
    "set_temperature": preset.init.status.set_temperature,
    "fan_speed": preset.init.status.fan_speed,
    "fan_direction": preset.init.status.fan_direction
  }
};
preset.sadness = {
  "status": {
    "power": 1,
    "operation_mode": 1,
    "set_temperature": preset.init.status.set_temperature + 2,
    "fan_speed": 1,
    "fan_direction": 4
  }
};
//var endpoint_uri = "https://api-08.daikin.ishikari-dc.net/equipments/";
var endpoint_uri = "https://api.daikin.ishikari-dc.net/equipments/";

//preset.area = [
//  [70,71,72,74,75],
//  [1,2,3,4,5] 
//];
preset.area = [
  [74]
];


// Trigger->Hackey!
app.param("power", function(req, res, next, power) {
  req.power = power;
  next();
});

app.post('/api/hackey/:power', function(req, res, next) {
  console.log(req);

  // AC-Control
  var _status =  preset.deinit.status;
  if ('on' == req.power) {
    _status =  preset.init.status;
  }

  preset.area.forEach(function(_area, i) {
    _area.forEach(function(_id, j) {
      var options = {
        url: endpoint_uri + _id + '/',
        headers: {
          "Authorization": "Basic ZGFpa2luOnBpY2hvbmt1bg==",
          "Content-Type": "application/json"
        },
        json: {
          "id": _id,
          "status": _status
        }
      };
      request.post(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log(body[0]);
        } else {
          console.log(error);
          console.log("result:" + response.statusCode);
          console.log("result:" + response.statusMessage);
        }
      });
    });
  });

  var options = {
    url: "http://hackey-app.cerevo.com/api/v1/blink/6ea2fa628e679a80",
  };
  if ('on' == req.power) {
    options.url = "http://hackey-app.cerevo.com/api/v1/blink/02a05ec105848dc0";
  };
  request.get(options, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body[0]);
    } else {
      console.log(response.statusCode);
    }
  });
  res.status(200).json({'result': 'OK'});
});


//app.post('/api/air/:mode', function(req, res, next){
//  console.log(req);
//  tone_analyzer.tone(req.body,
//    function(err, tone) {
//      if (err)
//        return next(err);
//      else
//        //console.log(JSON.stringify(tone, null, 2));
//        res.status(200).json(tone);
//  });
//});
app.param('emotion', function(req, res, next, emotion) {
  req.emotion = emotion;
  next();
});

app.post('/api/air/:emotion', function(req, res, next) {
  console.log(req);
  var _status = preset.init.status;

  switch(req.emotion) {
    case 'anger':
      _status = preset.anger.status;
      break;
    case 'disgust':
      _status = preset.disgust.status;
      break;
    case 'fear':
      _status = preset.fear.status;
      break;
    case 'joy':
      _status = preset.joy.status;
      break;
    case 'sadness':
      _status = preset.sadness.status;
      break;
  }


  //var body = {
  //  "id": 70,
  //  "status": {
  //    "power": 1,
  //    "operation_mode": 1,
  //    "set_temperature": 30,
  //    "fan_speed": 2,
  //    "fan_direction": 1
  //  }
  //};
  //var options = {
  //  url: endpoint_uri + "70/",
  //  headers: {
  //    "Authorization": "Basic ZGFpa2luOnBpY2hvbmt1bg==",
  //    "Content-Type": "application/json"
  //  },
  //  json: body
  //};

  ////options.url = endpoint_uri + '70/';
  ////console.log("debug:" + options.url);
  //console.log("debug:" + body);
  //request.post(options, function(error, response, body) {
  //  if (!error && response.statusCode == 200) {
  //    console.log(body[0]);
  //  } else {
  //    console.log(error);
  //    console.log("result:" + response.statusCode);
  //    console.log("result:" + response.statusMessage);
  //    res.status(500).json({'result': 'NG'});
  //  }
  //});
  preset.area.forEach(function(_area, i) {
    _area.forEach(function(_id, j) {
      var options = {
        url: endpoint_uri + _id + '/',
        headers: {
          "Authorization": "Basic ZGFpa2luOnBpY2hvbmt1bg==",
          "Content-Type": "application/json"
        },
        json: {
          "id": _id,
          "status": _status
        }
      };
      console.log("debug:" + options.url);
      request.post(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log(body[0]);
        } else {
          console.log(error);
          console.log("result:" + response.statusCode);
          console.log("result:" + response.statusMessage);
        }
      });
    });
  });
  res.status(200).json({'result': 'OK'});
});

app.get('/api/air', function(req, res){
  console.log(req);

  var options = {
    url: "https://api-08.daikin.ishikari-dc.net/equipments/",
    headers: {
      "Authorization": "Basic ZGFpa2luOnBpY2hvbmt1bg=="
    },
    json: true
  };
  request.get(options, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body[0]);
      res.status(200).json(body);
    } else {
      console.log(response.statusCode);
    }
  });
  //var options = {
  //  hostname: "api-08.daikin.ishikari-dc.net",
  //  port: 443,
  //  path: "/equipments",
  //  method: "GET",
  //  agent: false,
  //  headers: {
  //    "Authorization": "Basic ZGFpa2luOnBpY2hvbmt1bg=="
  //  }
  //};
  //var https = require('https');
  //var _req = https.request(options, function(_res) {
  //  var body = '';
  //  _res.on('data', function(chunk) {
  //    body += chunk;
  //  });
  //  _res.on('end', function() {
  //    if (_res.statusCode != 200) {
  //      console.log("failure: " + _res.statusCode);
  //    } else {
  //      console.log("Success: " + _res.statusCode);
  //      res.status(200).json(body);
  //    }
  //  });
  //  _res.on('error', function(err) {
  //    console.log("failure: " + err);
  //    return next(err);
  //  });
  //});
  //_req.end();
});

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
