import React, { Component } from 'react';
import ReactLoading from 'react-loading';

import Header from './Header.js';

import axios from 'axios'

export default class ResultPage extends Component {
  constructor(props){
    super(props)
    this.state = {
      departureSite: this.props.location.state.departureSite,
      arrivalSite: this.props.location.state.arrivalSite,
      airline: this.props.location.state.airline,
      flightNum: this.props.location.state.flightNum,
      flightDate: this.props.location.state.flightDate,

      departureDetailsLoaded: false,
      departureTime: "",
      departureTimeZone: "",
      flightExists: null,
      curTime: new Date(),
    }

    this.searchFlight = this.searchFlight.bind(this);
    this.getDepartureDetails = this.getDepartureDetails.bind(this);
  }

  componentDidMount(){
   this.searchFlight();
  }

  searchFlight(){
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

    axios.get(proxyurl + "https://flightlookup.azure-api.net/v1/xml/TimeTable/" 
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
      this.setState({flightExists: false, departureDetailsLoaded: true});
    }

    else{
      var flightDepartureTime = xmlDoc.getElementsByTagName("FlightDetails")[0].getAttribute("FLSDepartureDateTime");
      var flightDepartureTimeZone = xmlDoc.getElementsByTagName("FlightDetails")[0].getAttribute("FLSDepartureTimeOffset");

      this.setState({departureTime: flightDepartureTime, departureTimeZone: flightDepartureTimeZone});
      this.setState({flightExists: true, departureDetailsLoaded: true});

    }




  }


  render(){
    return(
      <div>
          <Header>
          </Header>
          {!this.state.departureDetailsLoaded && <ReactLoading type={"spinningBubbles"}/>};
          {this.state.departureDetailsLoaded && <div>
            {!this.state.flightExists ? <h1>Flight Not Found!</h1> : 

            <div>
              <p>{this.state.departureSite}</p>
              <p>{this.state.arrivalSite}</p>
              <p>{this.state.airline}</p>
              <p>{this.state.flightNum}</p>
              <p>{this.state.departureTime}</p>
              <p>{this.state.departureTimeZone}</p>
            </div>
          }
          </div>
        }
      </div>
    );
  }
}