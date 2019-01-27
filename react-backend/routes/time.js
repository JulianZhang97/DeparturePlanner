/* global google */
var express = require('express');
var router = express.Router();


/* GET users listing. */
router.get('/', function(req, res, next) {
  
  const googleMapsClient = require('@google/maps').createClient({
    key: process.env.SERVER_GOOGLE_API_KEY
  });

  const origin = req.query.origin;
  const destination = req.query.destination;
  const trafficMode =  req.query.trafficMode;
  const travelMode =  "driving";
  const departureTime = new Date();


  googleMapsClient.directions({
    origin: origin,
    destination: destination,
    mode: travelMode,
    departure_time: departureTime,
    traffic_model: trafficMode
  }, function(err, response){
    if(!err){
      const resultInfo = response.json;
      // console.log(resultInfo);
      res.json({
              directions: resultInfo
            });
    }
    else{
      console.log(err);
    }
  });
});


module.exports = router;

