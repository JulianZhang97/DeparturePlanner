import React, { Component } from 'react'

import Icon from '@material-ui/core/Icon'
import Grid from '@material-ui/core/Grid'
import Fab from '@material-ui/core/Fab';


import { BeatLoader } from 'react-spinners';

import DirectionsMap from './DirectionsMap.js'

import './Style.css'
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
      curDate: this.props.location.state.curDate,

      flightExists: null,

      // departureTime: "2019-01-26T19:50:00",
      // departureTimeZone: "-0500",

      worstCaseResult: null,
      regularCaseResult: null,
      bestCaseResult: null,

      departureTimeStr: "",
      message: "",
      travelInfo: "",
    }

    this.searchFlight = this.searchFlight.bind(this);
    this.getDepartureDetails = this.getDepartureDetails.bind(this);
    this.calculateDeparture = this.calculateDeparture.bind(this);

    this.handleHomeButton = this.handleHomeButton.bind(this);
  }


  async componentDidMount(){
      const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
      this.setState({mapsAPI: apiKey})

      await this.searchFlight();
      if(this.state.flightExists === true){
        this.calculateDeparture();
      }
      
      // this.calculateDeparture();
  }

  handleHomeButton(){
    this.props.history.push({
      pathname: '/'});
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
      self.getDepartureDetails(response.data);      
    })
    .catch(function (error) {
      console.log(error);
    });
  }


  getDepartureDetails(flightData){
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(flightData,"text/xml");
    
    if(xmlDoc.getElementsByTagName("FLSResponseFields").length === 0){
      console.log("Search Failed!");
      this.setState({flightExists: false});
      this.setState({message: "Flight not found!"});
    }
    
    else{
      console.log(xmlDoc);
      var departureTime = xmlDoc.getElementsByTagName("FlightDetails").item(0).getAttribute("FLSDepartureDateTime");
      var departureTimeZone = xmlDoc.getElementsByTagName("FlightDetails").item(0).getAttribute("FLSDepartureTimeOffset");

      console.log("Successfully retrieved flight");

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
    this.setState({departureTimeStr: flightDepartureTime.format('MMM Do YYYY, h:mma')})

    const curTime = moment();
    
    await axios.get('/time?' + 'origin=' + this.state.homeAddress + '&destination=' + this.state.departureSite +  '&trafficMode=best_guess')
      .then(res => this.setState({regularCaseResult: res.data.directions.routes[0].legs[0]}));
   
    //The recommended air port arrival time 
    const recommendedAirportArrivalTime = flightDepartureTime.clone().subtract(recommendedAirportTime, 'minutes');


    //Travel time in minutes 
    var duration = moment.duration(this.state.regularCaseResult.duration_in_traffic.value, 'seconds');
    const currentTravelTime = duration.humanize();


    const recommendedDepartureTime =  recommendedAirportArrivalTime.clone().subtract(currentTravelTime, 'minutes');

    //See if flight departure time minus recommended arrival gap minus bestguess travel time is < 90 mins
    const minsUntilDeparture = moment.duration(recommendedDepartureTime.diff(curTime)).asMinutes(); 


    //If > 90 mins, let user know lots of time left but remind users that traffic conditions change may be a factor
    //display bestguess time directions and travel time 
    if(minsUntilDeparture > 90){
      this.setState({travelInfo: "Current Travel Time: " + currentTravelTime});
      this.setState({message: "Over an hour left until you need to leave based on estimated travel time"
      + "and flight departure! However, keep in mind that traffic conditions may change from now until departure."});
    }

     //If < 90 mins and > 30 mins, run pessimistic traffic model search and see if large delays 
      //If pessmistic travel time is < 30 mins recommend that user leaves soon

      //If none of these cases are true, just state # of minutes until recommended departure time 
      //display bestguess directions, but BOTH bestguess and pessismistic travel times 
    else if(minsUntilDeparture > 30){
      try{
        await axios.get('/time?' + 'origin=' + this.state.homeAddress + '&destination=' + this.state.departureSite + '&trafficMode=pessimistic')
        .then(res => this.setState({worstCaseResult: res.data.directions.routes[0].legs[0]}));
      }
      catch(error){
        console.error('error fetching directions');
      }

    
      //In case traffic is bad, check worst case traffic to see if user should leave earlier  

      var worstCaseDuration = moment.duration(this.state.worstCaseResult.duration_in_traffic.value, 'seconds');
      const worstCaseTravelTime = worstCaseDuration.humanize();

      const estimatedWorstCaseDepartureTime = recommendedAirportArrivalTime.clone().subtract(worstCaseTravelTime, 'minutes');
      const minsUntilWorstCaseDeparture = moment.duration(estimatedWorstCaseDepartureTime.diff(curTime)).asMinutes();
      

      if(minsUntilWorstCaseDeparture < 30){
        this.setState({travelInfo: "Current Travel Time: " + currentTravelTime + "-" + worstCaseTravelTime});
        this.setState({message: "There is heavy traffic currently and your travel time may be much longer " +
        "than usual. We recommend that you leave soon."});
      }
      else{
        this.setState({travelInfo: "Current Travel Time: " + currentTravelTime + "-" + worstCaseTravelTime});
        this.setState({message: "You should not have to leave in the next 30 mins. However keep in mind traffic conditions may change."})
      }
    }


    //If best guess < 30 mins, let user know that they should leave soon (and display time left) 
    //display bestguess time directions and travel time
    else if(minsUntilDeparture > 0){
      this.setState({travelInfo: "Current Travel Time: " + currentTravelTime});
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
        this.setState({travelInfo: "Current Travel Time: " + currentTravelTime});
        this.setState({message: "You should leave immediately. Based on our projections, any traffic or airport delays may cause you to miss your flight."});
      }
      else{
        try{
          await axios.get('/time?' + 'origin=' + this.state.homeAddress + '&destination=' + this.state.departureSite + '&trafficMode=optimistic')
          .then(res => this.setState({bestCaseResult: res.data.directions.routes[0].legs[0]}));  
        }
        catch(error){
          console.error('error fetching directions');
        }

        var bestCaseDuration = moment.duration(this.state.bestCaseResult.duration_in_traffic.value, 'seconds');
        const bestCaseTravelTime = bestCaseDuration.humanize();
        const latestAbsoluteDepartureTime = latestAirportArrivalTime.clone().subtract(bestCaseTravelTime, 'minutes');
        const minsUntilLatestAbsoluteDeparture = moment.duration(latestAbsoluteDepartureTime.diff(curTime)).asMinutes();

        if(minsUntilLatestAbsoluteDeparture > 0){
          this.setState({travelInfo: "Current Travel Time: " + currentTravelTime});
          this.setState({message: "We recommend you leave immediately. Based on our projections, any traffic or airport delays may cause you to miss your flight."});
        }
        else{
          this.setState({travelInfo: "Current Travel Time: " + currentTravelTime});
          this.setState({message: "According to our calculations, you are most likely unable to make this flight."});
        } 
      }
    }
  }


  render(){
    return(
        <div id="main-page">
          <div className="result-header">
            <p className="header-title">DeparturePlanner</p>
            <p className="header-subtext">Never miss a flight again</p>

            <div className="cur-date"> Current Time: {" " +  
              moment(this.state.curDate).format('MMM Do YYYY, h:mma')}</div>
          </div>

          <div className="new-search-button">
                <Fab variant="extended" aria-label="Delete" onClick={this.handleHomeButton}>
                <Icon>home</Icon>Home
            </Fab>
          </div>
         
          <div className="result-content">
            <Grid     container  
                      direction="column"
                      justify="center"
                      alignItems="center"
                      spacing={12}>
             <Grid item xs={3}>
              <BeatLoader
                  // css={override}
                  sizeUnit={"px"}
                  size={150}
                  color={'#123abc'}
                  loading={this.state.flightExists === null}/>
              {this.state.flightExists === true && <div className="flight-info">
                <p><Icon className="plane-icon">flight</Icon> {this.state.airline}{this.state.flightNum}:  {this.state.departureSite} <Icon>arrow_forward</Icon> {this.state.arrivalSite}</p>
                <p><Icon>access_time</Icon> {this.state.departureTimeStr}</p>
              </div>}
            </Grid>
            <Grid item xs={10}>
              <div className="travel-info">
                <BeatLoader
                  // css={override}
                  sizeUnit={"px"}
                  size={150}
                  color={'#123abc'}
                  loading={this.state.message === ""}/>
                <p>{this.state.message}</p>
              </div>
            </Grid>  
          </Grid>  
          <div className="map-pane">  
          <p>{this.state.travelInfo}</p> 
            <DirectionsMap
              origin={this.state.homeAddress}
              destination={this.state.departureSite}
              travelMode={"DRIVING"}
              googleMapURL={"https://maps.googleapis.com/maps/api/js?key=" + this.state.mapsAPI + "&v=3.exp&libraries=geometry,drawing,places"}/> 
          </div>
        </div> 

      </div>
    );
  }
}