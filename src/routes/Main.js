import React, { Component } from 'react';
import './Main.scss'

import Logo from '../components/Main/Logo';
import Search from '../components/Main/Search';


class Main extends Component {
    render() {
        return (
            <div className="main">
                <div className="main-wrap">
                    <Logo/>
                    <Search/>
                </div>
            </div>
        );
    }
}

export default Main;
