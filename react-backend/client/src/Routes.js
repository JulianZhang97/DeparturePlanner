import React from 'react';

import { Route, Switch, BrowserRouter } from "react-router-dom";

import MainPage from './components/MainPage.js';
import ResultPage from './components/ResultPage.js';

export default () =>
<BrowserRouter>
  <Switch>
    <Route exact path="/" component={MainPage} />
    <Route path="/result" component={ResultPage} />
  </Switch>
</BrowserRouter>