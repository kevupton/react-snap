import Button from '@material-ui/core/Button/Button';
import * as React from 'react';
import { FunctionComponent } from 'react';
import { withObservableStream } from '../../lib/observable-stream';
import { gameState, GameStatus } from '../../modules/game/game.state';
import { Slider } from '../slider/Slider';
import './Menu.scss';

interface MenuProps {
}

interface MenuState {
  gameStatus : GameStatus;
}

const menu : FunctionComponent<MenuProps & MenuState> = (
  { gameStatus = GameStatus.PENDING },
) => {
  return (
    <div className='game-menu'>
      <Slider />

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
};

export const Menu = withObservableStream<MenuProps>({
  gameStatus: gameState.gameStatus$,
})(menu);
