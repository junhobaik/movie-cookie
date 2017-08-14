import React, { Component } from 'react';
import './App.scss';

import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';

import Main from './routes/Main';
import Ad from './components/Ad/Ad';

class App extends Component {
    render() {
        return (
            <Router>
                <div>
                    <Switch>
                        <Route exact path="/" component={Main}/>
                    </Switch>
                    <Ad/>
                </div>
            </Router>
        );
    }
}

export default App;
