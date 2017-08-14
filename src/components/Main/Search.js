import React, { Component } from 'react';

import { Input } from 'semantic-ui-react';


class Search extends Component {
    render() {
        return (
            <div className="search">
                <Input
                    icon={{ name: 'search', circular: true, link: true }}
                    placeholder='Search...'
                />
            </div>
        );
    }
}

export default Search;