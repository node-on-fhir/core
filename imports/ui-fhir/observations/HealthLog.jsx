

import { Meteor } from 'meteor/meteor';
import React  from 'react';
import { useTracker } from 'meteor/react-meteor-data';


import { VitalMeasurements } from './VitalMeasurements';

import PropTypes from 'prop-types';

export class Healthlog extends React.Component {
  getMeteorData() {
    let data = {
      style: {},
      state: {
        isLoggedIn: false
      }
    };

    if (Meteor.user()) {
      data.state.isLoggedIn = true;
    }

    return data;
  }

  renderAuthenticatedUserControls(isLoggedIn) {

    // user should be able to see the addPost component if they're logged in and looking at their
    // own profile; otherwise,
    if (isLoggedIn) {
      if (!this.props.routeParams.userId) {
        return (
          <div>
            <VitalMeasurements />
          </div>
        );
      }
    }
  }

  render() {
    return (
      <div id="weblogPage">
        <div>
          { this.renderAuthenticatedUserControls(this.data.state.isLoggedIn) }
        </div>
      </div>
    );
  }
}


Healthlog.propTypes = {
  children: PropTypes.any
};

export default Healthlog;