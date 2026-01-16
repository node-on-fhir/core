// packages/vital-signs/client/components/displays/VitalSignsChartWrapper.jsx

import React, { lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { CircularProgress, Box } from '@mui/material';
import { get } from 'lodash';

// Lazy load chart components
const RechartsVitalSignsChart = lazy(() => import('../../charts/recharts/VitalSignsChart'));
const NivoVitalSignsChart = lazy(() => import('../../charts/nivo/VitalSignsChart'));

function VitalSignsChartWrapper(props) {
  const { chartLibrary = 'recharts', ...chartProps } = props;
  
  // Get chart library preference from settings if not specified
  const libraryPreference = chartLibrary || get(Meteor, 'settings.public.vitalSigns.chartLibrary', 'recharts');
  
  const ChartComponent = libraryPreference === 'nivo' ? NivoVitalSignsChart : RechartsVitalSignsChart;
  
  return (
    <Suspense 
      fallback={
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      }
    >
      <ChartComponent {...chartProps} />
    </Suspense>
  );
}

VitalSignsChartWrapper.propTypes = {
  chartLibrary: PropTypes.oneOf(['recharts', 'nivo']),
  observations: PropTypes.array,
  height: PropTypes.number,
  timeRange: PropTypes.string,
  selectedVitalSigns: PropTypes.array,
  showNormalRange: PropTypes.bool
};

export default VitalSignsChartWrapper;