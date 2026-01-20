import React, {Component} from 'react';
import {render} from 'react-dom';




export class SortableQuestionnaire extends React.Component {
    constructor(props) {
        super(props);
    }
    state = {
        items: this.props.items
    };

    render() {
      console.log('SortableQuestionnaire.state', this.state)
        return(<div>SortableList</div>)
    }
}

export default SortableQuestionnaire;
