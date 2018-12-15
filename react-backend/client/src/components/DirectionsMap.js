/* global google */


import React, { Component } from 'react';
import { withScriptjs, GoogleMap, withGoogleMap, DirectionsRenderer} from 'react-google-maps';
import { compose, withProps, lifecycle} from 'recompose'


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



export default class DirectionsMap extends Component {  
    render(){
        {console.log(this.props)}
        return(
            <MapWithADirectionsRenderer 
                    origin={this.props.origin} 
                    destination={this.props.destination} 
                    travelMode={this.props.travelMode} 
                    drivingOptions={this.props.drivingOptions}
                    googleMapURL={"https://maps.googleapis.com/maps/api/js?key=" + this.props.mapsAPI + "&v=3.exp&libraries=geometry,drawing,places"}/> 
        )
    }
}