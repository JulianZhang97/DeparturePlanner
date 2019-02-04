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

      // departureTime: "2019-02-02T20:40:00",
      // departureTimeZone: "-0500",
      departureTimeStr: "",

      worstCaseResult: null,
      regularCaseResult: null,
      bestCaseResult: null,
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

      //Uncomment these three lines testing with flight API
      await this.searchFlight();
      if(this.state.flightExists === true){
        this.calculateDeparture();
      }
      
      //Uncomment three lines testing without flight API
      // this.setState({flightExists: true});
      // this.setState({departureTimeStr: moment(this.state.departureTime + this.state.departureTimeZone).format('MMM D, h:mma')});   
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
    try{
      var res = await axios.get(proxyurl + "https://flightlookup.azure-api.net/v1/xml/TimeTable/" 
      + this.state.departureSite + "/" + this.state.arrivalSite + "/" 
      + this.state.flightDate, init);

      self.getDepartureDetails(res.data);   
      this.setState({departureTimeStr: moment(this.state.departureTime + this.state.departureTimeZone).format('MMM Do YYYY, h:mma')});   
    }
    catch(error){
      console.error("Error retrieving flight");
    }
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
      var departureTime = xmlDoc.getElementsByTagName("FlightDetails").item(0).getAttribute("FLSDepartureDateTime");
      var departureTimeZone = xmlDoc.getElementsByTagName("FlightDetails").item(0).getAttribute("FLSDepartureTimeOffset");

      this.setState({departureTime: departureTime, departureTimeZone: departureTimeZone});
      this.setState({flightExists: true});
    }
  }


  async calculateDeparture(){
    try{
      const res = await axios.get('/time?' + 'origin=' + this.state.homeAddress + '&destination=' 
      + this.state.departureSite + '&departureTime=' + this.state.departureTime + '&departureTimeZone=' + 
      this.state.departureTimeZone);
      this.setState({travelInfo: res.data.travelInfo, message: res.data.message})
    }
    catch(error){
      console.error('error calculating departure times')
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
                      alignItems="center">
             <Grid item xs={3}>
              <BeatLoader
                  sizeUnit={"px"}
                  size={50}
                  color={'#123abc'}
                  loading={this.state.flightExists === null || this.state.message === ""}/>
              {this.state.flightExists === true && this.state.message !== "" && <div className="flight-info">
                <p><Icon className="plane-icon">flight</Icon> {this.state.airline}{this.state.flightNum}:  {this.state.departureSite} <Icon>arrow_forward</Icon> {this.state.arrivalSite}</p>
                <p><Icon>access_time</Icon> {this.state.departureTimeStr}</p>
              </div>}
            </Grid>
            <Grid item xs={10}>
              <div className="travel-info">
                {this.state.message !== "" && <p>{this.state.message}</p>}
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