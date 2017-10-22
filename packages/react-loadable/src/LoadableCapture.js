// @flow
import React, { type ElementType } from 'react';
import PropTypes from 'prop-types';

type LoadableCaptureProps = {
  report: () => mixed,
  children: ElementType,
};

export default class LoadableCapture extends React.Component<LoadableCaptureProps> {
  static propTypes = {
    report: PropTypes.func.isRequired,
  };

  static childContextTypes = {
    loadable: PropTypes.shape({
      report: PropTypes.func.isRequired,
    }).isRequired,
  };

  getChildContext() {
    return {
      loadable: {
        report: this.props.report,
      },
    };
  }

  render() {
    return React.Children.only(this.props.children);
  }
}
