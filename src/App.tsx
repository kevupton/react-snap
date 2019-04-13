import * as React from 'react';
import './App.scss';
import { CenterDeck, ComputerDeck, PlayerDeck } from './components/deck/Deck';
import { Menu } from './components/menu/Menu';
import { gameState, Suite } from './modules/game/game.state';

const App = () => (
  <div className="App">
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

export default App;
