import React, { Component } from 'react';

import Header from './Header.js';
import DirectionsMap from './DirectionsMap.js'


import axios from 'axios'
import moment from 'moment'



export default class ResultPage extends Component {
  constructor(props){
    super(props)
    this.state = {
      departureSite: this.props.location.state.departureSite,
      arrivalSite: this.props.location.state.arrivalSite,
      airline: this.props.location.state.airline,
      flightNum: this.props.location.state.flightNum,
      flightDate: this.props.location.state.flightDate,
      homeAddress: this.props.location.state.homeAddress,


      flightExists: null,

      departureTime: "2019-01-20T17:50:00",
      departureTimeZone: "-0500",

      worstCaseResult: null,
      regularCaseResult: null,
      bestCaseResult: null,

      message: "",
      travelInfo: "",
    }

    this.searchFlight = this.searchFlight.bind(this);
    this.getDepartureDetails = this.getDepartureDetails.bind(this);
    this.calculateDeparture = this.calculateDeparture.bind(this);
    
  }

  componentDidMount(){
      const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
      this.setState({mapsAPI: apiKey})

      //Must wait for this server call
      // this.searchFlight();

      // if(this.state.flightExists === true)
        //Must wait for this server call
        // this.calculateDeparture();
      this.calculateDeparture();
  }


  async searchFlight(){
    const flightSearchKey = process.env.REACT_APP_FLIGHT_API_KEY;
    const proxyurl = "https://cors-anywhere.herokuapp.com/";
    const init = {
      headers: {
        "Ocp-Apim-Subscription-Key": flightSearchKey
      },
      params: {
        "Airline": this.state.airline,
        "FlightNumber": this.state.flightNum,
      }
    }
    var self = this;
    await axios.get(proxyurl + "https://flightlookup.azure-api.net/v1/xml/TimeTable/" 
    + this.state.departureSite + "/" + this.state.arrivalSite + "/" 
    + this.state.flightDate, init)
    .then(function (response) {
      // console.log(response.data);
      self.getDepartureDetails(response.data);      
    })
    .catch(function (error) {
      console.log(error);
    });
  }


  getDepartureDetails(flightData){
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(flightData,"text/xml");
    
    if(!xmlDoc.getElementsByTagName("Success").length === 0){
      console.log("Search Failed!");
      this.setState({flightExists: false});
    }

    else{
      var departureTime = xmlDoc.getElementsByTagName("FlightDetails")[0].getAttribute("FLSDepartureDateTime");
      var departureTimeZone = xmlDoc.getElementsByTagName("FlightDetails")[0].getAttribute("FLSDepartureTimeOffset");

      this.setState({departureTime: departureTime, departureTimeZone: departureTimeZone});
      this.setState({flightExists: true});
    }
  }


  async calculateDeparture(){
    //The RECOMMENDED # of minutes to arrive before departure 
    const recommendedAirportTime = 120;

    //The MINIMUM # of minutes to arrive before departure
    const minimumAirportTime = 60;

    const flightDepartureTime = moment(this.state.departureTime + this.state.departureTimeZone);
    const flightDepartureTimeStr = flightDepartureTime.format('MMMM Do YYYY, h:mm:ss a');

    const curTime = moment();
    
    
    await axios.get('/time?' + 'origin=' + this.state.homeAddress + '&destination=' + this.state.departureSite +  '&trafficMode=best_guess')
      .then(res => this.setState({regularCaseResult: res.data.directions.routes[0].legs[0]}));
   
    //The recommended air port arrival time 
    const recommendedAirportArrivalTime = flightDepartureTime.clone().subtract(recommendedAirportTime, 'minutes');


    //Travel time in minutes 
    const currentTravelTime = this.state.regularCaseResult.duration_in_traffic.value/60;

    const recommendedDepartureTime =  recommendedAirportArrivalTime.clone().subtract(currentTravelTime, 'minutes');


    // console.log(recommendedDepartureTime.format('MMMM Do YYYY, h:mm:ss a'));

    //See if flight departure time minus recommended arrival gap minus bestguess travel time is < 90 mins
    const minsUntilDeparture = moment.duration(recommendedDepartureTime.diff(curTime)).asMinutes(); 


    //If > 90 mins, let user know lots of time left but remind users that traffic conditions change may be a factor
    //display bestguess time directions and travel time 
    if(minsUntilDeparture > 90){
      this.setState({travelInfo: "Current Travel Time:" + currentTravelTime + "Flight Departure Time:" + flightDepartureTimeStr});
      this.setState({message: "Over an hour left until you need to leave based on estimated travel time"
      + "and flight departure! However, keep in mind that traffic conditions may change from now until departure."});
    }

     //If < 90 mins and > 30 mins, run pessimistic traffic model search and see if large delays 
      //If pessmistic travel time is < 30 mins recommend that user leaves soon

      //If none of these cases are true, just state # of minutes until recommended departure time 
      //display bestguess directions, but BOTH bestguess and pessismistic travel times 
    else if(minsUntilDeparture > 30){

      //Must wait for this call 
      try{
        await axios.get('/time?' + 'origin=' + this.state.homeAddress + '&destination=' + this.state.departureSite + '&trafficMode=pessimistic')
        .then(res => this.setState({worstCaseResult: res.data.directions.routes[0].legs[0]}));
      }
      catch(error){
        console.error('error fetching directions');
      }

    
      //In case traffic is bad, check worst case traffic to see if user should leave earlier  
      const worstCaseTravelTime = this.state.worstCaseResult.duration_in_traffic.value/60;


      const estimatedWorstCaseDepartureTime = recommendedAirportArrivalTime.clone().subtract(worstCaseTravelTime, 'minutes');
      const minsUntilWorstCaseDeparture = moment.duration(estimatedWorstCaseDepartureTime.diff(curTime)).asMinutes();
      

      if(minsUntilWorstCaseDeparture < 30){
        this.setState({travelInfo: "Current Travel Time:" + currentTravelTime + "-" + worstCaseTravelTime + "Flight Departure Time:" + flightDepartureTimeStr});
        this.setState({message: "There is heavy traffic currently and your travel time may be much longer " +
        "than usual. We recommend that you leave soon."});
      }
      else{
        this.setState({travelInfo: "Current Travel Time:" + currentTravelTime + "-" + worstCaseTravelTime + "Flight Departure Time:" + flightDepartureTimeStr});
        this.setState({message: "You should not have to leave in the next 30 mins. However keep in mind traffic conditions may change."})
      }
    }


    //If best guess < 30 mins, let user know that they should leave soon (and display time left) 
    //display bestguess time directions and travel time
    else if(minsUntilDeparture > 0){
      this.setState({travelInfo: "Current Travel Time:" + currentTravelTime + "Flight Departure Time:" + flightDepartureTimeStr});
      this.setState({message: "You should leave soon."});
    }


    //If best guess is negative time (not enough time left until departure)
      //If using minimum arrival gap is positive, tell user they should leave immediately and 
    
      //If still negative, add optimistic traffic model and check again...if positive, let user know
      //to leave immediately but they might not make their flight 

      //If all the above added and still negative let user know that they will not be able to make their
      //flight with DeparturePlanner calculations 

      //display optimistic time directions and travel time 
    else{
      const latestAirportArrivalTime = flightDepartureTime.clone().subtract(minimumAirportTime, 'minutes');
      const latestNormalDepartureTime = latestAirportArrivalTime.clone().subtract(currentTravelTime, 'minutes');
      const minsUntilLatestNormalDeparture = moment.duration(latestNormalDepartureTime.diff(curTime)).asMinutes();

      if(minsUntilLatestNormalDeparture > 0){
        this.setState({travelInfo: "Current Travel Time:" + currentTravelTime + "Flight Departure Time:" + flightDepartureTimeStr});
        this.setState({message: "You should leave immediately. Based on our projections, any traffic or airport delays may cause you to miss your flight."});
      }
      else{
        //Must wait for this call 
        try{
          await axios.get('/time?' + 'origin=' + this.state.homeAddress + '&destination=' + this.state.departureSite + '&trafficMode=optimistic')
          .then(res => this.setState({bestCaseResult: res.data.directions.routes[0].legs[0]}));  
        }
        catch(error){
          console.error('error fetching directions');
        }

      
        const bestCaseTravelTime = this.state.bestCaseResult.duration_in_traffic.value/60;
        const latestAbsoluteDepartureTime = latestAirportArrivalTime.clone().subtract(bestCaseTravelTime, 'minutes');
        const minsUntilLatestAbsoluteDeparture = moment.duration(latestAbsoluteDepartureTime.diff(curTime)).asMinutes();

        if(minsUntilLatestAbsoluteDeparture > 0){
          this.setState({travelInfo: "Current Travel Time:" + bestCaseTravelTime + "-" + currentTravelTime + "Flight Departure Time:" + flightDepartureTimeStr});
          this.setState({message: "We recommend you leave immediately. Based on our projections, any traffic or airport delays may cause you to miss your flight."});
        }
        else{
          this.setState({travelInfo: "Current Travel Time:" + bestCaseTravelTime +  "-" + currentTravelTime + "Flight Departure Time:" + flightDepartureTimeStr});
          this.setState({message: "According to our calculations, you are most likely unable to make this flight."});
        } 
      }
    }
  }


  render(){
    return(
      <div>
        <Header></Header>
          <div>
            <div className="mapPane">  
              <DirectionsMap
                origin={this.state.homeAddress}
                destination={this.state.departureSite}
                travelMode={"DRIVING"}
                googleMapURL={this.state.mapsAPI}
                /> 
            </div>
            <p>{this.state.message}</p>
            <p>{this.state.travelInfo}</p>

            <p>{this.state.departureSite}</p>
            <p>{this.state.arrivalSite}</p>
            <p>{this.state.airline}</p>
            <p>{this.state.flightNum}</p>
            <p>{this.state.departureTime}</p>
            <p>{this.state.departureTimeZone}</p>
          </div>
    </div>
    );
  }
}