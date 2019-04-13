import * as React from 'react';
import { FunctionComponent } from 'react';
import { ICard } from '../../modules/game/game.state';
import './Card.scss';

interface CardProps {
  hidden? : boolean;
  card : ICard;
}

export const Card : FunctionComponent<CardProps> = ({ hidden = false, card }) => {
  return (
    <div className={ 'card ' + (hidden ? 'hidden' : '') }
         style={{ transform: 'rotate(' + card.rotation + 'deg)' }}>
      { !hidden && (
        <div>
          <div className='top-left'>
            <span>{ card.number }</span>
            <img src={card.suite.toString()} />
          </div>

          <div className='bottom-right'>
            <img src={card.suite.toString()} />
            <span>{ card.number }</span>
          </div>
        </div>
      ) }
    </div>
  );
};
