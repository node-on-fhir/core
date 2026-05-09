// packages/data-importer/client/ImportStoreContext.jsx
//
// Simplified React Context + useReducer for the Data Import page state.
// Stripped-down version of merkalis ViewerStoreContext — no merkle state.

import React, { createContext, useContext, useReducer } from 'react';

var initialState = {
  // REST API tab
  httpMethod: 'GET',
  httpUrl: 'http://localhost:3000/baseR4/Patient/8ae88d45-4998-cf3b-6cf4-2d1f9d1324c6',
  patientJson: '{}',
  responseJson: '',

  // Resource list (File Drop tab)
  resourceList: [],
  resourceListSource: null,
  resourceListViewMode: 'accordion',
  selectedResourceIndex: -1,

  // Editor
  editorMode: 'form',

  // UI
  isLoading: false,
  error: null,
  isDark: false
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PATIENT_JSON':
      if (action.payload === state.patientJson) return state;
      return Object.assign({}, state, { patientJson: action.payload });

    case 'SET_RESPONSE_JSON':
      if (action.payload === state.responseJson) return state;
      return Object.assign({}, state, { responseJson: action.payload });

    case 'SET_EDITOR_MODE':
      return Object.assign({}, state, { editorMode: action.payload });

    case 'SET_HTTP_METHOD':
      return Object.assign({}, state, { httpMethod: action.payload });

    case 'SET_HTTP_URL':
      return Object.assign({}, state, { httpUrl: action.payload });

    case 'SET_LOADING':
      return Object.assign({}, state, { isLoading: action.payload });

    case 'SET_ERROR':
      return Object.assign({}, state, { error: action.payload });

    case 'SET_IS_DARK':
      return Object.assign({}, state, { isDark: action.payload });

    case 'SET_RESOURCE_LIST':
      return Object.assign({}, state, {
        resourceList: action.payload.resources,
        resourceListSource: action.payload.source,
        selectedResourceIndex: -1
      });

    case 'SET_RESOURCE_LIST_VIEW_MODE':
      return Object.assign({}, state, { resourceListViewMode: action.payload });

    case 'SET_SELECTED_RESOURCE_INDEX':
      return Object.assign({}, state, { selectedResourceIndex: action.payload });

    case 'CLEAR_RESOURCE_LIST':
      return Object.assign({}, state, {
        resourceList: [],
        resourceListSource: null,
        selectedResourceIndex: -1
      });

    default:
      console.warn('[ImportStoreContext] Unknown action:', action.type);
      return state;
  }
}

var ImportStoreContext = createContext(null);

export function ImportStoreProvider(props) {
  var stateAndDispatch = useReducer(reducer, initialState);
  var state = stateAndDispatch[0];
  var dispatch = stateAndDispatch[1];

  return (
    <ImportStoreContext.Provider value={{ state: state, dispatch: dispatch }}>
      {props.children}
    </ImportStoreContext.Provider>
  );
}

export function useImportStore() {
  var context = useContext(ImportStoreContext);
  if (!context) {
    throw new Error('useImportStore must be used within an ImportStoreProvider');
  }
  return context;
}

export default ImportStoreContext;
