import React, { Component } from 'react';

import { compose, withProps, lifecycle } from 'recompose'
import { withScriptjs} from 'react-google-maps'

const { StandaloneSearchBox } = require("react-google-maps/lib/components/places/StandaloneSearchBox");

const PlacesWithStandaloneSearchBox = compose(
  withProps({
    loadingElement: <div style={{ height: `100%` }} />,
    containerElement: <div style={{ height: `400px` }} />,
  }),
  lifecycle({
    componentWillMount() {
      const refs = {}
      this.setState({
        onSearchBoxMounted: ref => {
          refs.searchBox = ref;
        },
        onPlacesChanged: () => {
          const places = refs.searchBox.getPlaces();
          if(places[0] === undefined){
            alert('Error! Please enter location again.');}
          if(places[0] !== undefined){
            this.props.setAddress(places[0].formatted_address)
          }
        },
      })
    },
  }),
  withScriptjs  
)(props =>
  <div data-standalone-searchbox="">
    <StandaloneSearchBox
      ref={props.onSearchBoxMounted}
      bounds={props.bounds}
      onPlacesChanged={props.onPlacesChanged}>
      <input
        type="text"
        placeholder="E.g. 1234 West Street, Toronto, ON"
        className={props.className}
      />
    </StandaloneSearchBox>
  </div>
);

export default class AddressSearch extends Component {  
    render(){
        return(
            <PlacesWithStandaloneSearchBox 
            googleMapURL={this.props.googleMapURL}
            setAddress={this.props.setAddress}
            className={this.props.className}
            />
        )
    }
}