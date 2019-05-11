import Button from '@material-ui/core/Button/Button';
import * as React from 'react';
import { ReactiveXComponent } from 'reactive-x-component';
import { gameState, GameStatus } from '../../modules/game/game.state';
import { Slider } from '../slider/Slider';
import './Menu.scss';

export const Menu = ReactiveXComponent({
  gameStatus: gameState.gameStatus$,
})((
  { gameStatus = GameStatus.PENDING },
) => {
  return (
    <div className='game-menu'>
      <Slider/>

      <Button variant="contained" onClick={ () => gameState.startNewGame() }>
        { gameStatus === GameStatus.READY ? 'Play Game' : 'Restart Game' }
      </Button>

      { ![GameStatus.PENDING, GameStatus.READY].includes(gameStatus) && (
        <Button variant='contained' color='secondary' className="stop-playing-btn" onClick={ () => gameState.reset() }>
          Stop Playing
        </Button>
      ) }
    </div>
  );
});
