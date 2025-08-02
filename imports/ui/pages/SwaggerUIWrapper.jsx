// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui/pages/SwaggerUIWrapper.jsx

import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

// SwaggerUI wrapper using CDN version
function SwaggerUIWrapper({ spec }) {
  const swaggerUIRef = useRef(null);

  useEffect(() => {
    // Dynamically load SwaggerUI from CDN
    if (typeof window !== 'undefined' && window.SwaggerUIBundle) {
      const ui = window.SwaggerUIBundle({
        spec: spec,
        dom_id: '#swagger-ui-container',
        deepLinking: true,
        presets: [
          window.SwaggerUIBundle.presets.apis,
          window.SwaggerUIStandalonePreset
        ],
        plugins: [
          window.SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
      
      window.ui = ui;
    }
  }, [spec]);

  return (
    <Box sx={{ 
      '& .swagger-ui': {
        fontFamily: 'inherit'
      }
    }}>
      <div id="swagger-ui-container" ref={swaggerUIRef}></div>
    </Box>
  );
}

export default SwaggerUIWrapper;