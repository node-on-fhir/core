// imports/ui/ErrorBoundary.jsx

import React from 'react';
import { get } from 'lodash';
import WorkflowRegistry from '/imports/lib/WorkflowRegistry.js';
import ErrorPage from './extensible/ErrorPage.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const log = Meteor.Logger ? Meteor.Logger.for('ErrorBoundary') : console;
    log.error('Error caught in ErrorBoundary: ' + (error && error.message), { componentStack: get(errorInfo, 'componentStack', '').slice(0, 2000) });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      // Class component, so no hook here — a direct registry read is fine:
      // errors render long after workflow registration completes.
      const ErrorPageOverride = WorkflowRegistry.getComponent('ErrorPage');
      const Fallback = ErrorPageOverride || ErrorPage;
      return React.createElement(Fallback, {});
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
