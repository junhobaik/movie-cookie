import React, { Component } from 'react';
import './Main.scss'

import Logo from '../components/Main/Logo';
import Search from '../components/Main/Search';


class Main extends Component {
    render() {
        return (
            <div className="Main">
                <Logo/>
                <Search/>
            </div>
        );
    }
}

export default Main;
