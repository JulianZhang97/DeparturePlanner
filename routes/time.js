/* global google */
var moment = require('moment');
var express = require('express');

var router = express.Router();

const curTime = moment();

//The RECOMMENDED # of minutes to arrive before departure 
const recommendedAirportTime = 120;

//The MINIMUM # of minutes to arrive before departure
const minimumAirportTime = 60;


const googleMapsClient = require('@google/maps').createClient({
  key: process.env.SERVER_GOOGLE_API_KEY,
  Promise: Promise
});

router.get('/', async function(req, res, next) {
  const homeAddress = req.query.origin;
  const departureSite = req.query.destination;
  const departureTime = req.query.departureTime;
  const departureTimeZone = req.query.departureTimeZone;
  var travelInfo = "";
  var message = "";

  const flightDepartureTime = moment(departureTime + departureTimeZone, "YYYY-MM-DDTHH:mm:ss ZZ");
  const recommendedAirportArrivalTime = flightDepartureTime.clone().subtract(recommendedAirportTime, 'minutes');
  const latestAirportArrivalTime = flightDepartureTime.clone().subtract(minimumAirportTime, 'minutes');

  var regularDurationVal;
  try{
    const regularDurationResult = await getTravelTime(homeAddress, departureSite, "best_guess");
    const resultInfo = regularDurationResult.json;
    regularDurationVal = resultInfo.routes[0].legs[0].duration_in_traffic.value;
  }
  catch(error){
    console.error('error fetching best_guess directions');
  }
  
  const currentBestGuessTravelTime =  moment.duration(regularDurationVal, 'seconds');
  const currentBestGuessTravelTimeStr = currentBestGuessTravelTime.humanize();
  travelInfo = "Estimated Current Travel Time: " + currentBestGuessTravelTimeStr;

  
  const recommendedDepartureTime =  recommendedAirportArrivalTime.clone().subtract(currentBestGuessTravelTime, 'minutes');
  const minsUntilDeparture = moment.duration(recommendedDepartureTime.diff(curTime)).asMinutes(); 

  console.log("When your flight leaves: " + flightDepartureTime.format());
  console.log("When you should arrive at airport: " + recommendedAirportArrivalTime.format());
  console.log("When you should leave the house: " + recommendedDepartureTime.format());
  console.log(minsUntilDeparture);

  if(minsUntilDeparture > 0 && minsUntilDeparture < 30){
    message = "You should leave soon.";
  }
  else if(minsUntilDeparture > 90){
    message = "Over an hour left until you need to leave based on estimated travel time "
    + "and flight departure! Keep in mind that traffic conditions may change.";
  }

  //If < 90 mins and > 30 mins, run pessimistic traffic model and see if large delays 
  //If pessmistic travel time is < 30 mins recommend that user leaves soon
  else if(minsUntilDeparture > 30){
    var worstCaseDurationVal;
    try{
      const worstCaseResult = await getTravelTime(homeAddress, departureSite, "pessimistic");
      const worstCaseInfo = worstCaseResult.json;
      worstCaseDurationVal = worstCaseInfo.routes[0].legs[0].duration_in_traffic.value;
    }
    catch(error){console.error('error fetching pessimistic directions');}

    const heavyTrafficTravelTime = moment.duration(worstCaseDurationVal, 'seconds');
    const estimatedWorstCaseDepartureTime = recommendedAirportArrivalTime.clone().subtract(heavyTrafficTravelTime, 'minutes');
    const minsUntilWorstCaseDeparture = moment.duration(estimatedWorstCaseDepartureTime.diff(curTime)).asMinutes();
    
    if(minsUntilWorstCaseDeparture < 30){
      message = "There is heavy traffic currently and your travel time may be longer " +
      "than usual. We recommend leaving soon.";
    }
    else{
      message = "You should not have to leave in the next 30 mins. However keep in mind traffic conditions may change.";
    }
  }
  //If best guess is negative time (not enough time left until departure), check with minimum airport time
  //If still negative, add optimistic traffic model and check again...if positive, let user know
  //to leave immediately but they might not make their flight
  //If all the above added and still negative let user know that they will not be able to make their flight
  else{
    const latestNormalDepartureTime = latestAirportArrivalTime.clone().subtract(currentBestGuessTravelTime, 'minutes');
    const minsUntilLatestNormalDeparture = moment.duration(latestNormalDepartureTime.diff(curTime)).asMinutes();

    if(minsUntilLatestNormalDeparture > 0){
      message = "You should leave immediately. Based on our projections, any traffic or airport delays may cause you to miss your flight.";
    }
    else{
      var bestCaseDurationVal;
      try{
        const bestCaseResult = await getTravelTime(homeAddress, departureSite, "optimistic");
        bestCaseDurationVal = bestCaseResult.json.routes[0].legs[0].duration_in_traffic.value;
      }
      catch(error){console.error('error fetching optimistic directions');}

      const bestCaseTravelTime = moment.duration(bestCaseDurationVal, 'seconds');
      const absoluteLatestDepartureTime = latestAirportArrivalTime.clone().subtract(bestCaseTravelTime, 'minutes');
      const minsUntilLatestAbsoluteDeparture = moment.duration(absoluteLatestDepartureTime.diff(curTime)).asMinutes();

      if(minsUntilLatestAbsoluteDeparture > 0){
        message = "We recommend you leave immediately. Based on our projections, any traffic or airport delays may cause you to miss your flight.";
      }
      else{
        message = "According to our calculations, you are likely unable to make this flight.";
      } 
    }
  }

  res.json({
    travelInfo: travelInfo,
    message: message
  });
});


function getTravelTime(origin, destination, trafficMode){
  return googleMapsClient.directions({
    origin: origin,
    destination: destination,
    mode:  "driving",
    departure_time: new Date(),
    traffic_model: trafficMode})
    .asPromise();
}


module.exports = router;

