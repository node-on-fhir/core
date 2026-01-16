import React, { useState } from 'react';

import { Index } from './Index'
import { useNavigate } from "react-router-dom";


export const Hello = () => {
  const navigate = useNavigate();
  
  const [counter, setCounter] = useState(0);

  const increment = () => {
    setCounter(counter + 1);
  };

  return (
    <div id="HelloPage">
      <Index />      
    </div>
  );
};
