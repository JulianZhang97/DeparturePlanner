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
        places: [],
        onSearchBoxMounted: ref => {
          refs.searchBox = ref;
        },
        onPlacesChanged: () => {
          const places = refs.searchBox.getPlaces();

          this.setState({
            places,
          });

          this.props.setAddress(this.state.places[0].formatted_address)
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
    constructor(props) {
        super(props);
        this.state = {
          searchAddress : ""
          };
        }  

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