import React, { useState, useEffect, useCallback } from 'react';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { HTTP } from 'meteor/http';
import { Random } from 'meteor/random';

import { Button } from '@mui/material';

import { get } from 'lodash';
import JSON5 from 'json5';

import { useTracker } from 'meteor/react-meteor-data';



//============================================================================================================================
// IPS Buttons

export function LeaderboardPageButtons(props){


  function handleButtonClick(){
    console.log('handleButtonClick');
  }

  return (
    <div className="footer-buttons-leaderboard-starter">
      <Button id="leaderboard-starter-click-footer-btn" onClick={ handleButtonClick.bind(this) } >
        Click
      </Button>
    </div>
  );
}




