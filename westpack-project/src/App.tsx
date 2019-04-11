import { FunctionComponent } from 'react';
import * as React from 'react';
import './App.scss';
import { CenterDeck, ComputerDeck, PlayerDeck } from './components/deck/Deck';
import { withObservableStream } from './lib/observable-stream';
import { gameState, GameStatus } from './modules/game/game.state';

interface IAppState {
  status : GameStatus;
}

const App : FunctionComponent<IAppState> = ({ status = GameStatus.INITIALIZING } : IAppState) => (
  <div className="App">
    <PlayerDeck hidden={ true }/>
    <CenterDeck/>
    <ComputerDeck hidden={ true }/>

    { status === GameStatus.READY && (
      <button onClick={ () => gameState.setup() }>Play Game</button>
    ) }
  </div>
);

export default withObservableStream({ status: gameState.gameStatus$ })(App);
