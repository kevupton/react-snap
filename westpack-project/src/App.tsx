import * as React from 'react';
import { FunctionComponent } from 'react';
import './App.scss';
import { CenterDeck, ComputerDeck, PlayerDeck } from './components/deck/Deck';
import { withObservableStream } from './lib/observable-stream';
import { gameState, GameStatus, Suite } from './modules/game/game.state';

interface IAppState {
  status : GameStatus;
}

const App : FunctionComponent<IAppState> = ({ status = GameStatus.INITIALIZING } : IAppState) => (
  <div className="App">
    <div className='preload-images'>
      <img src={ Suite.SPADES.toString() }/>
      <img src={ Suite.CLUBS.toString() }/>
      <img src={ Suite.DIAMONDS.toString() }/>
      <img src={ Suite.HEARTS.toString() }/>
    </div>

    <div className='game-container'>
      <ComputerDeck hidden={ true }/>
      <CenterDeck onClick={ () => gameState.snapCards() } animationDelay={ false }/>
      <PlayerDeck hidden={ true } onClick={ () => gameState.drawPlayerCard$() }/>
    </div>

    <div className='game-menu'>
      <button onClick={ () => gameState.startNewGame() }>
        { status === GameStatus.READY ? 'Play Game' : 'Restart Game' }
      </button>
    </div>
  </div>
);

export default withObservableStream({ status: gameState.gameStatus$ })(App);
