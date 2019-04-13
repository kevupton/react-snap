import Typography from '@material-ui/core/Typography/Typography';
import MatSlider from '@material-ui/lab/Slider/Slider';
import * as React from 'react';
import { FunctionComponent } from 'react';
import { withObservableStream } from '../../lib/observable-stream';
import { gameState } from '../../modules/game/game.state';
import './Slider.scss';

interface SliderState {
  value : number;
}

const slider : FunctionComponent<SliderState> = ({ value = 0 }) => (
  <div className="slider-container">
    <Typography id="label">Reaction Time: <b>{ value / 1000 } sec</b></Typography>
    <MatSlider
      className='slider'
      value={value}
      min={ 0 }
      max={ 5000 }
      step={ 100 }
      aria-labelledby="label"
      onChange={ (event, value) => gameState.updateReactionTime(value) }
    />
  </div>
);

export const Slider = withObservableStream({ value: gameState.botReactionTime$ })(slider);
