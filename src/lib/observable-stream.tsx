import * as React from 'react';
import { Observable, Subscription } from 'rxjs';

export interface IObservableState {
  [key : string] : Observable<any>;
}

/**
 * Observable Stream maps observables to values,
 * and passes their values through to the props of the provided component.
 * This is a wrapper to use RxJS as a state manager.
 *
 * @param state
 * @param defaultState
 */
export function withObservableStream<T, O extends IObservableState = IObservableState> (
  state : O,
  defaultState? : any,
) {
  return (Component : React.ComponentType) : React.ComponentType<T> => {
    return class extends React.Component<T, {[key in keyof O] : any}> {
      public state = defaultState;
      private readonly subscription = new Subscription();

      public componentDidMount () {
        Object.keys(state)
          .forEach(key => this.subscribeToUpdates(key));
      }

      public componentWillUnmount () {
        this.subscription.unsubscribe();
      }

      public render () {
        return (
          <Component { ...this.props } { ...this.state } />
        );
      }

      private subscribeToUpdates (key : string) {
        this.subscription.add(state[key].subscribe(value => this.setState({ [key]: value })));
      }
    };
  };

}
