// imports/ui/guards/DataGuard.jsx
//
// Render-tree guard: renders children when dataCount > 0, otherwise the
// NoDataPage fallback (overridable via components: { NoDataPage: ... }).
// Card props (title, subheader, buttonLabel, ...) pass through to the
// fallback so existing callers keep their custom copy.
//
// Formerly imports/ui/NoDataWrapper.jsx — the old path re-exports this
// component as a deprecated alias.

import React from 'react';
import PropTypes from 'prop-types';
import { useOverridableComponent } from '../hooks/useOverridableComponent';
import NoDataPage from '../extensible/NoDataPage';

export function DataGuard({
    children,
    dataCount = 0,
    title = "No Data",
    subheader = "Click the button to begin importing data.",
    buttonLabel = "Import Data",
    noDataImagePath = "NoData.png",
    marginTop = "0px",
    redirectPath = "/import-data",
    titleVariant = "h5"
}){

    const NoDataComponent = useOverridableComponent('NoDataPage', NoDataPage);

    if(dataCount > 0){
        return children || null;
    }

    return (
        <NoDataComponent
            title={title}
            subheader={subheader}
            buttonLabel={buttonLabel}
            noDataImagePath={noDataImagePath}
            marginTop={marginTop}
            redirectPath={redirectPath}
            titleVariant={titleVariant}
        />
    );
}

DataGuard.propTypes = {
    dataCount: PropTypes.number,
    title: PropTypes.string,
    subheader: PropTypes.string,
    buttonLabel: PropTypes.string,
    noDataImagePath: PropTypes.string,
    marginTop: PropTypes.string,
    redirectPath: PropTypes.string,
    titleVariant: PropTypes.string
};

export default DataGuard;
