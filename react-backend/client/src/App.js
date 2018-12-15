import React, { Component } from 'react';

import Routes from './Routes.js';


class App extends Component {
  state = {users: []}

  componentDidMount() {
    // fetch('/users')
    //   .then(res => res.json())
    //   .then(users => this.setState({ users }));
  }

  render() {
    return (
      <div>
        <Routes></Routes>
      </div>
    );
  }
}

export default App;
