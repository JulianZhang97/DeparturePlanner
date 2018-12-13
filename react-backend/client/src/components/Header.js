import React, { Component } from 'react';
import './Header.css'

export default class Header extends Component {
    render(){
      return(
        <div className="departure-header">
          <p className="header-title">DeparturePlanner</p>
          <p className="header-subtext">Never miss a flight again</p>
        </div>
      );
    }
  }