import * as React from 'react';
import { Observable, Subscription } from 'rxjs';

export interface IObservableState {
  [key : string] : Observable<any>;
}

export const withObservableStream = (
  state : IObservableState,
) =>
  (Component : React.ComponentType) => {
    return class extends React.Component {
      private readonly subscription = new Subscription();

      componentDidMount () {
        Object.keys(state)
          .forEach(key => this.subscribeToUpdates(key));
      }

      componentWillUnmount () {
        this.subscription.unsubscribe();
      }

      render () {
        return (
          <Component { ...this.props } { ...this.state } />
        );
      }

      private subscribeToUpdates (key : string) {
        this.subscription.add(state[key].subscribe(value => this.setState({ [key]: value })));
      }
    };
  };
