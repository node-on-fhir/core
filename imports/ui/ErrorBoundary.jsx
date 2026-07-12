import React from 'react';
import { get } from 'lodash';

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
      return this.props.fallback || <div>Something went wrong.</div>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;