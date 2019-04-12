import * as React from 'react';
import { FunctionComponent } from 'react';
import { withObservableStream } from '../../lib/observable-stream';
import { gameState, ICard } from '../../modules/game/game.state';
import { Card } from '../card/Card';
import './Deck.scss';

interface DeckState {
  cards : ICard[];
  round : number;
}

interface DeckProps {
  hidden? : boolean;
  animationDelay? : boolean;
  onClick? : () => any;
}

const Deck : FunctionComponent<DeckProps & DeckState> = (
  {
    cards = [],
    hidden = false,
    animationDelay = true,
    onClick = () => {},
    round,
  },
) => {
  return (
    <div className={ 'deck ' + (!animationDelay ? 'no-delay' : '') } onClick={ () => onClick() }>
      { cards.map((card) => (
        <Card key={ `${ card.number }.${ card.suite }.${ round }` } card={ card } hidden={ hidden }/>
      )) }
    </div>
  );
};

const DeckWithRound = withObservableStream({ round: gameState.round$ })(Deck);

export const PlayerDeck   = withObservableStream<DeckProps>({ cards: gameState.playerHand$ })(DeckWithRound);
export const ComputerDeck = withObservableStream<DeckProps>({ cards: gameState.computerHand$ })(DeckWithRound);
export const CenterDeck   = withObservableStream<DeckProps>({ cards: gameState.pile$ })(DeckWithRound);
