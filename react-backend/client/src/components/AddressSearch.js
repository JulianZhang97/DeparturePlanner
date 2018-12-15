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
      onPlacesChanged={props.onPlacesChanged}
    >
      <input
        type="text"
        placeholder="Departure Address"
        style={{
          boxSizing: `border-box`,
          border: `1px solid transparent`,
          width: `300px`,
          height: `32px`,
          padding: `0 12px`,
          borderRadius: `3px`,
          boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`,
          fontSize: `14px`,
          outline: `none`,
          textOverflow: `ellipses`,
        }}
      />
    </StandaloneSearchBox>
    {/* <ol>
      {props.places.map(({ place_id, formatted_address, geometry: { location } }) =>
        <li key={place_id}>
          {formatted_address}
          {" at "}
          ({location.lat()}, {location.lng()})
        </li>
      )}
    </ol> */}
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
            />
        )
    }
}