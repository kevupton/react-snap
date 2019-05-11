import Typography from '@material-ui/core/Typography/Typography';
import MatSlider from '@material-ui/lab/Slider/Slider';
import * as React from 'react';
import { ReactiveXComponent } from 'reactive-x-component';
import { gameState } from '../../modules/game/game.state';
import './Slider.scss';

export const Slider = ReactiveXComponent({ value: gameState.botReactionTime$ })(({ value = 0 }) => (
  <div className="slider-container">
    <Typography id="label">Reaction Time: <b>{ value / 1000 } sec</b></Typography>
    <MatSlider
      className='slider'
      value={ value }
      min={ 0 }
      max={ 5000 }
      step={ 100 }
      aria-labelledby="label"
      onChange={ (event, value) => gameState.updateReactionTime(value) }
    />
  </div>
));
