import React, { Component } from 'react';
import {GoogleMap, DirectionsService, DirectionsRenderer, TrafficLayer, LoadScript} from 'react-google-maps-api'

class DirectionsMap extends Component {

  state = {
    response: null,
  }


directionsCallback = response => {
  if (response !== null) {
    if (response.status === 'OK') {
      this.setState(
        () => ({
          response
        })
      )
    } else {
      console.log('response: ', response)
    }
  }
}

  render() {
    return (
    
          <div>
          <LoadScript
              id="script-loader"
              googleMapsApiKey={this.props.googleMapURL}
              language={"en"}
              region={"EN"}
              version={"weekly"}
              libraries={[]}
              onLoad={() => console.log("script loaded")}
              loadingElement={<div>Loading...</div>}
            >
          
         <GoogleMap
            id="basic-map-example"
            mapContainerStyle={{
              height: "400px",
              width: "100%"
            }}
            options={({
                      disableDefaultUI: true,
                      gestureHandling: "none",})}
            zoom={8}
            center={{
              lat: 41.8507300,
              lng:-87.6512600
            }}>
            <TrafficLayer/>
            {
            <DirectionsService
              options={{ // eslint-disable-line react-perf/jsx-no-new-object-as-prop
                destination: this.props.destination,
                origin: this.props.origin,
                travelMode: this.props.travelMode
              }}
              callback={this.directionsCallback}
            />
            }
            {this.state.response !== null && (
              
            <DirectionsRenderer
              options={{ // eslint-disable-line react-perf/jsx-no-new-object-as-prop
                directions: this.state.response
              }}
            />)}
            </GoogleMap>
         
        </LoadScript>
          </div>
    );
  }
}

export default DirectionsMap;