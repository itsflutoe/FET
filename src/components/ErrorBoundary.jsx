import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Something unexpected happened.',
    };
  }

  componentDidCatch(error, info) {
    console.error('[Future LPT Companion]', error, info?.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-card">
            <div className="eyebrow">COMPANION GLITCH</div>
            <h1>Your companion hit a snag.</h1>
            <p className="muted">
              An unexpected error stopped the UI. Your local data is still in this
              browser — try reloading.
            </p>
            {this.state.message && (
              <pre className="error-detail">{this.state.message}</pre>
            )}
            <button className="primary" type="button" onClick={this.handleReload}>
              Reload companion
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
