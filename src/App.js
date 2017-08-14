import React, { Component } from 'react';
import './App.css';

import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';

import Main from './routes/Main';

class App extends Component {
  render() {
    return (
      <Router>
        <Switch>
          <Route exact path="/" component={Main}/>
        </Switch>
      </Router>
    );
  }
}

export default App;
