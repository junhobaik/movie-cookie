import React, { Component } from 'react';


import logoImg from '../../images/logo.png';

class Logo extends Component {
    render() {
        return (
            <div className="logo">
                <img src={logoImg} alt="LOGO_IMG"/>
            </div>
        );
    }
}

export default Logo;