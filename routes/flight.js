var express = require('express');
var router = express.Router();

var axios = require('axios');

router.get('/', function(req, res, next) {
  const departureSite = req.query.departureSite;
  const arrivalSite = req.query.arrivalSite;
  const airline = req.query.airline;
  const flightNum = req.query.flightNum;
  const flightDate = req.query.flightDate;


  const init = {
    headers: {
      "Ocp-Apim-Subscription-Key": process.env.REACT_APP_FLIGHT_API_KEY
    },
    params: {
      "Airline": airline,
      "FlightNumber": flightNum,
    }
  }
  axios.get("https://flightlookup.azure-api.net/v1/xml/TimeTable/" 
  + departureSite + "/" + arrivalSite + "/" + flightDate, init)
  .then(function(response){
    console.log(response);
    res.json({
      flightInfo: response.data
    })
  })
  .catch(function(error){
    console.log(error);
    console.error("Error retrieving flight");
  });
});

module.exports = router;