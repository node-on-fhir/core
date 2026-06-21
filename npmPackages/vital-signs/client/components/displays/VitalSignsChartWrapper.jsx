// packages/vital-signs/client/components/displays/VitalSignsChartWrapper.jsx

import React, { lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { CircularProgress, Box } from '@mui/material';
import { get } from 'lodash';

// Lazy-load the chart component.
// NOTE: the Atmosphere package shipped both a recharts and a nivo implementation
// and defaulted to recharts. recharts cannot be added as an npm dependency here
// without an ERESOLVE peer conflict that rewrites the whole workspace lockfile
// (its react-dom peer collides with a react-dom@19 already in the tree). The nivo
// implementation (@nivo/line, already present) renders the same vital-signs line
// chart, so this build uses nivo only. charts/recharts/ is kept for reference but
// is no longer imported, so Rspack does not need recharts.
const NivoVitalSignsChart = lazy(() => import('../../charts/nivo/VitalSignsChart'));

function VitalSignsChartWrapper(props) {
  const { chartLibrary = 'nivo', ...chartProps } = props;

  // chartLibrary is accepted for API compatibility, but only the nivo chart is
  // bundled (see note above).
  const ChartComponent = NivoVitalSignsChart;

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