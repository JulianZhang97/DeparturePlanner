/* global google */

import React, { Component } from 'react';

import { Button } from 'react-bootstrap';
import Autocomplete from 'react-autocomplete'
import axios from 'axios'
import { withScriptjs, GoogleMap, withGoogleMap, DirectionsRenderer} from 'react-google-maps';

import { compose, withProps, lifecycle} from 'recompose'
// const { compose, withProps, lifecycle} = require("recompose");

import AddressSearch from './AddressSearch.js'
import Header from './Header.js'
import './MainPage.css'
import airlines from './Airlines.js'


var dateOptions = {hour: 'numeric', minute: 'numeric', timeZoneName: 'short', weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'};


const MapWithADirectionsRenderer = compose(
  withProps({
    loadingElement: <div style={{ height: `100%` }} />,
    containerElement: <div style={{ height: `400px` }} />,
    mapElement: <div style={{ height: `75%`, width: `100%` }} />,
  }),
  // withState('mapPane', 'onMapLoad'),
  // withHandlers(() => {
  //   const refs = {
  //     map: undefined,
  //   }
  //   return {
  //     onMapMounted: () => ref => {
  //       refs.map = ref;
  //     },
  //     onMapChanged: ({ onMapLoad }) => () => {
  //       onMapLoad(refs.map)
  //     }
  //   }
  // }),
  withScriptjs,
  withGoogleMap,
  lifecycle({
    componentDidMount() {
      const DirectionsService = new google.maps.DirectionsService();
      DirectionsService.route({
        origin: this.props.origin,
        destination: this.props.destination,
        travelMode: this.props.travelMode,
        drivingOptions: this.props.drivingOptions}, 
        
        (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          console.log(result.routes[0].legs[0]);
          this.setState({
            directions: result,
          });
        } else {
          console.error(`error fetching directions ${result}`);
        }
      });
    }
  })
)(props =>
  <GoogleMap
    defaultCenter={new google.maps.LatLng(41.8507300, -87.6512600)}
    options={({
      disableDefaultUI: true,
      gestureHandling: "none",

    })}

    // ref={props.onMapMounted}
    // onTilesLoaded={props.onMapChanged}
    >
    {props.directions && 
    <DirectionsRenderer 
    directions={props.directions} 
    panel={props.mapRef}
    />
    }
  </GoogleMap>
);

export default class MainPage extends Component {  
  constructor(props) {
    super(props);
    this.state = {
      departureSiteBox: "",
      departureSite: "",
      siteList : [],
      arrivalSiteBox: "",
      arrivalSite: "",
      airlineList : airlines.airlines,
      filteredAirlineList: [],
      airline: "",
      airlineBox: "",
      flightNum: "",
      curDate: new Date(),
      startAddress: "",

      mapsAPI: "", 
      
      

      testOrigin: "Eaton Centre",
      testDest: "YYZ",
      travelMode: "DRIVING",
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: 'optimistic'
      },
      };

      this.handleAirlineFieldChange = this.handleAirlineFieldChange.bind(this)
      this.handleAirlineSelect = this.handleAirlineSelect.bind(this)

      this.handleDepartureFieldChange = this.handleDepartureFieldChange.bind(this)
      this.handleDepartureSiteSelect = this.handleDepartureSiteSelect.bind(this)
      this.searchSites = this.searchSites.bind(this)
      this.handleArrivalFieldChange = this.handleArrivalFieldChange.bind(this)
      this.handleArrivalSiteSelect = this.handleArrivalSiteSelect.bind(this)

      this.updateFlightNum = this.updateFlightNum.bind(this)
      this.handleSubmit = this.handleSubmit.bind(this)

      this.getStartAddress = this.getStartAddress.bind(this)
    }  

    componentDidMount(){
      const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
      this.setState({mapsAPI: apiKey})
    }

    handleSubmit(){
      const flightDate = this.state.curDate.getFullYear() + ""
       + (("0" + (this.state.curDate.getMonth() + 1)).slice(-2)) + "" + (("0" + this.state.curDate.getDate()).slice(-2)) 
      

      this.props.history.push({
        pathname: '/result', 
        state: {departureSite: this.state.departureSite, 
                flightDate: flightDate, 
                arrivalSite: this.state.arrivalSite,
                airline: this.state.airline, 
                flightNum: this.state.flightNum}
        });
    }

    getStartAddress = (address) => {
      this.setState({startAddress: address})
      console.log(this.state);
    }


    searchSites(keyword){
      const airportKey = process.env.REACT_APP_AIRPORT_API_KEY;
      if(keyword !== ""){
        const init = {
          params: {
            apikey: airportKey,
            term: keyword
          }
        }
        var self = this;

        axios.get("https://api.sandbox.amadeus.com/v1.2/airports/autocomplete", init)
        .then(function (response) {
          self.setState({siteList: response.data});
        })
        .catch(function (error) {
          console.log(error);
        });
      } 
    }

    updateFlightNum(e){
      this.setState({flightNum: e.target.value})
    }


    handleAirlineFieldChange(e){
      this.setState({airlineBox: e.target.value})
      const filteredArray = this.state.airlineList.filter(airline => 
        airline.name.toUpperCase().includes(e.target.value.toUpperCase()))
      const limitedFilteredArray = filteredArray.slice(0, 20);
      
      this.setState({filteredAirlineList: limitedFilteredArray})
    }

    handleAirlineSelect(item){
      this.setState({airlineBox: item.name})
      this.setState({airline: item.iata_code})
      this.setState({filteredAirlineList: []})

    }


    handleDepartureFieldChange(e){
      this.setState({departureSiteBox: e.target.value})
      this.searchSites(e.target.value)  
    }

    handleDepartureSiteSelect(item){
      this.setState({departureSiteBox: item.label})
      this.setState({departureSite: item.value})
      this.setState({siteList: []})
    }

    handleArrivalFieldChange(e){
      this.setState({arrivalSiteBox: e.target.value})
      this.searchSites(e.target.value)  
    }

    handleArrivalSiteSelect(item){
      this.setState({arrivalSiteBox: item.label})
      this.setState({arrivalSite: item.value})
      this.setState({siteList: []})
    }


    render(){
      return(
        <div id="main-page">
            <Header>              
            </Header>

              <div className="home-address">
                Home Address:
                <div className="address-autofill">
                {this.state.mapsAPI !== "" &&  <AddressSearch
                    googleMapURL={"https://maps.googleapis.com/maps/api/js?key=" + this.state.mapsAPI + "&v=3.exp&libraries=geometry,drawing,places"}
                    setAddress ={this.getStartAddress}
                    /> 
                }
                </div>
              </div>
            <div className="form-container">
              <div className="cur-date"> Travel Date:
              {" " + this.state.curDate.toLocaleDateString("en-US", dateOptions)}
              </div>
                {this.state.mapsAPI !== "" && 
                <div className="mapPane">        
                  <MapWithADirectionsRenderer 
                    origin={this.state.testOrigin} 
                    destination={this.state.testDest} 
                    travelMode={this.state.travelMode} 
                    drivingOptions={this.state.drivingOptions}
                    googleMapURL={"https://maps.googleapis.com/maps/api/js?key=" + this.state.mapsAPI + "&v=3.exp&libraries=geometry,drawing,places"}/> 
                </div>
                }
              <div className="airports"> 

                  <div className="airport">Departure Airport:  
                    <Autocomplete
                      getItemValue={(item) => item.value}
                      items={this.state.siteList}
                      renderItem={(item, isHighlighted) =>
                        <div style={{ background: isHighlighted ? 'lightgray' : 'white' }}>
                          {item.label}
                        </div>
                      }
                      value={this.state.departureSiteBox}
                      onChange={e => this.handleDepartureFieldChange(e)}
                      onSelect={(value, item) => this.handleDepartureSiteSelect(item)}
                      /> 
                  </div>
                  <div className="airport">Arrival Airport:
                    <Autocomplete
                      getItemValue={(item) => item.value}
                      items={this.state.siteList}
                      renderItem={(item, isHighlighted) =>
                        <div style={{ background: isHighlighted ? 'lightgray' : 'white' }}>
                          {item.label}
                        </div>
                      }
                      value={this.state.arrivalSiteBox}
                      onChange={e => this.handleArrivalFieldChange(e)}
                      onSelect={(value, item) => this.handleArrivalSiteSelect(item)}
                    /> 
                  </div>
              </div>
              <div className="flight-info"> 
                  <div className="flight-details">Airline: 
                    <Autocomplete
                      getItemValue={(item) => item.iata_code}
                      items={this.state.filteredAirlineList}
                      renderItem={(item, isHighlighted) =>
                        <div style={{ background: isHighlighted ? 'lightgray' : 'white' }}>
                          {item.name}
                        </div>
                      }
                      value={this.state.airlineBox}
                      onChange={e => this.handleAirlineFieldChange(e)}
                      onSelect={(value, item) => this.handleAirlineSelect(item)}
                    /> 
                  </div>
                  <div className="flight-details">Flight #: <input value={this.state.flightNum} type="text" onChange={this.updateFlightNum}/></div>
              </div>
              <div><Button onClick={this.handleSubmit}>Calculate Travel Times</Button></div>
            </div>
        </div>
      );
    }
  }