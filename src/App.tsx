import * as React from 'react';
import { FunctionComponent } from 'react';
import './App.scss';
import { ReactiveXComponent } from 'reactive-x-component';
import { CenterDeck, ComputerDeck, PlayerDeck } from './components/deck/Deck';
import { Menu } from './components/menu/Menu';
import { gameState, GameStatus, Suite } from './modules/game/game.state';
import * as classNames from 'classnames';

interface AppState {
  gameStatus : GameStatus;
}

const App : FunctionComponent<AppState> = ({ gameStatus = GameStatus.PENDING }) => (
  <div className={classNames('app', gameStatus)}>
    <div className='preload-images'>
      <img src={ Suite.SPADES.toString() }/>
      <img src={ Suite.CLUBS.toString() }/>
      <img src={ Suite.DIAMONDS.toString() }/>
      <img src={ Suite.HEARTS.toString() }/>
    </div>

    <h1>Snap</h1>

    <div className='game-container'>
      <ComputerDeck hidden={ true }/>
      <CenterDeck onClick={ () => gameState.snapCards() } animationDelay={ false }/>
      <PlayerDeck hidden={ true } onClick={ () => gameState.drawPlayerCard$() }/>
    </div>

    <Menu/>
  </div>
);

export default ReactiveXComponent({ gameStatus: gameState.gameStatus$ })(App);
