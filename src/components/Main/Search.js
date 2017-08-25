import React, { Component } from 'react';

import { Input } from 'semantic-ui-react';


class Search extends Component {

    componentDidMount(){
        document.querySelector('.search i').onclick = function() {
            document.querySelector('.search form').submit();
            return false;
        };
    }

    render() {
        return (
            <div className="search">
                <form action="/search" method="get">
                    <Input name="movie"
                           icon={{ name: 'search', circular: true, link: true }}
                           placeholder='Search...'
                    />
                </form>
            </div>
        );
    }
}

export default Search;