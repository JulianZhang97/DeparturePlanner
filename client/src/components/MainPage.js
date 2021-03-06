import React, { Component } from 'react'

import Button from '@material-ui/core/Button'
import Icon from '@material-ui/core/Icon'
import Grid from '@material-ui/core/Grid'

import Autocomplete from 'react-autocomplete'
import moment from 'moment'
import Fade from 'react-reveal/Fade'
import axios from 'axios'

import AddressSearch from './AddressSearch.js'
import './Style.css'
import airlines from './Airlines.js'


export default class MainPage extends Component {  
  constructor(props) {
    super(props);
    this.state = {
      departureSiteBox: "",
      departureSite: "",
      arrivalSiteList : [],
      departureSiteList: [],
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

      inputStatus: 0
      };

      this.handleAirlineFieldChange = this.handleAirlineFieldChange.bind(this)
      this.handleAirlineSelect = this.handleAirlineSelect.bind(this)
      this.handleDepartureFieldChange = this.handleDepartureFieldChange.bind(this)
      this.handleDepartureSiteSelect = this.handleDepartureSiteSelect.bind(this)
      this.searchSites = this.searchSites.bind(this)
      this.handleArrivalFieldChange = this.handleArrivalFieldChange.bind(this)
      this.handleArrivalSiteSelect = this.handleArrivalSiteSelect.bind(this)
      this.updateFlightNum = this.updateFlightNum.bind(this)
      this.handleNextButton = this.handleNextButton.bind(this)
      this.handlePreviousButton = this.handlePreviousButton.bind(this)
      this.getStartAddress = this.getStartAddress.bind(this)
    }  

    componentDidMount(){
      const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
      this.setState({mapsAPI: apiKey})
    }

    handleNextButton(){
      if(this.state.inputStatus < 2){
        const inputNum = this.state.inputStatus;
        this.setState({inputStatus: inputNum + 1});
      }

      if(this.state.inputStatus === 2){
        const flightDate = this.state.curDate.getFullYear() + ""
       + (("0" + (this.state.curDate.getMonth() + 1)).slice(-2)) + "" + (("0" + this.state.curDate.getDate()).slice(-2)) 
      

        this.props.history.push({
          pathname: '/result', 
          state: {departureSite: this.state.departureSite, 
                  flightDate: flightDate, 
                  arrivalSite: this.state.arrivalSite,
                  airline: this.state.airline, 
                  flightNum: this.state.flightNum,
                  homeAddress: this.state.startAddress,
                  curTime: this.state.curDate}
          });
        }
    }

    handlePreviousButton(){
      if(this.state.inputStatus > 0){
        const inputNum = this.state.inputStatus;
        this.setState({inputStatus: inputNum - 1});
      }
    }


    getStartAddress = (address) => {
      this.setState({startAddress: address})
    }


    async searchSites(searchKeyword, siteType){
      if(searchKeyword === ""){
        siteType === "departure" ? this.setState({departureSiteList: []}): this.setState({arrivalSiteList: []});
      }
      else{
        try{
          var res =  await axios.get('/airports?' + 'searchKeyword=' + searchKeyword);
          if(res.data.siteList !== undefined && res.data.siteList.length !== 0){
            siteType === "departure" ? this.setState({departureSiteList: res.data.siteList}): this.setState({arrivalSiteList: res.data.siteList});
          }
        }
        catch(error){
          console.error('Error finding sites');
        }
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
      this.searchSites(e.target.value, "departure")  
    }

    handleDepartureSiteSelect(item){
      this.setState({departureSiteBox: item.detailedName})
      this.setState({departureSite: item.iataCode})
      this.setState({siteList: []})
    }

    handleArrivalFieldChange(e){
      this.setState({arrivalSiteBox: e.target.value})
      this.searchSites(e.target.value, "arrival");  
    }

    handleArrivalSiteSelect(item){
      this.setState({arrivalSiteBox: item.detailedName})
      this.setState({arrivalSite: item.iataCode})
      this.setState({siteList: []})
    }



    render(){
      return(
        <div id="main-page">
            <div className="main-header">
              <p className="header-title">DeparturePlanner</p>
              <p className="header-subtext">Never miss a flight again</p>
              <div className="cur-date"> Current Time: {" " +  
              moment(this.state.curDate).format('MMM Do YYYY, h:mma')}</div>
            </div>

            <div className="main-content">
              <div className="form-container">
                  {this.state.inputStatus === 0 && <Fade><div className="home-address form-node">  
                  <div className="input-title">  Where are you leaving from?</div> 
                    {this.state.mapsAPI !== "" &&  <AddressSearch
                        className="input-box"
                        googleMapURL={"https://maps.googleapis.com/maps/api/js?key=" + this.state.mapsAPI + "&v=3.exp&libraries=geometry,drawing,places"}
                        setAddress ={this.getStartAddress}/> }
                  </div></Fade>}
                 {this.state.inputStatus === 1 &&  <Fade><div className="departure-airport form-node">
                  <div className="input-title"> Departure Airport:</div>  
                    <Autocomplete 
                      inputProps={{className:"input-box"}}
                      getItemValue={(item) => item.iataCode}
                      menuStyle={{zIndex: '998', borderRadius: '5px'}}
                      items={this.state.departureSiteList}
                      renderItem={(item, isHighlighted) =>
                        <div key={item.id} className="input-dropdown"
                        style={{ background: isHighlighted ? 'lightgray' : 'white' }}>
                          {item.detailedName}
                        </div>}
                      value={this.state.departureSiteBox}
                      onChange={e => this.handleDepartureFieldChange(e)}
                      onSelect={(value, item) => this.handleDepartureSiteSelect(item)}/> 
                  </div></Fade>}
                  {this.state.inputStatus === 1 && <Fade><div className="arrival-airport form-node">
                  <div className="input-title"> Arrival Airport:</div>
                    <Autocomplete
                      inputProps={{className:"input-box"}}
                      menuStyle={{zIndex: '998', borderRadius: '5px'}}
                      getItemValue={(item) => item.iataCode}
                      items={this.state.arrivalSiteList}
                      renderItem={(item, isHighlighted) =>
                        <div key={item.id} className="input-dropdown" style={{ background: isHighlighted ? 'lightgray' : 'white' }}>
                          {item.detailedName}
                        </div>
                      }
                      value={this.state.arrivalSiteBox}
                      onChange={e => this.handleArrivalFieldChange(e)}
                      onSelect={(value, item) => this.handleArrivalSiteSelect(item)}/> 
                  </div></Fade>}
                
                  {this.state.inputStatus === 2 && <Fade><div className="flight-details form-node"> 
                  <div className="input-title"> Airline:</div>
                    <Autocomplete
                      inputProps={{className:"input-box"}}
                      getItemValue={(item) => item.iata_code}
                      items={this.state.filteredAirlineList}
                      menuStyle={{zIndex: '998', borderRadius: '5px'}}
                      renderItem={(item, isHighlighted) =>
                        <div key={item.iata_code} className="input-dropdown" style={{background: isHighlighted ? 'lightgray' : 'white'}}>
                          {item.name}
                        </div>}
                      value={this.state.airlineBox}
                      onChange={e => this.handleAirlineFieldChange(e)}
                      onSelect={(value, item) => this.handleAirlineSelect(item)}/> 
                  </div></Fade>}
                  {this.state.inputStatus === 2 && <Fade><div className="flight-details form-node">
                  <div className="input-title"> Flight# :
                  </div><input  className="input-box" value={this.state.flightNum} type="text" onChange={this.updateFlightNum}/></div></Fade>}
              </div>
              <Grid container  
                    direction="row"
                    justify="center"
                    alignItems="center"
                    // spacing={24}
                    >
                <Grid item xs={5} sm={3} md={2} xl={1}>
                  <div><Button size="large" variant="contained" color="secondary" onClick={this.handlePreviousButton}><Icon>arrow_back</Icon>Previous</Button></div>
                </Grid>
                <Grid item xs={5} sm={3} md={2} xl={1}>
                  <div><Button size="large" variant="contained" color="primary" onClick={this.handleNextButton}>Next<Icon>arrow_forward</Icon></Button></div>
                </Grid>
              </Grid>
          </div>
        </div>
      );
    }
  }