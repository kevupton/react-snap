import * as React from 'react';
import { FunctionComponent } from 'react';
import { withObservableStream } from '../../lib/observable-stream';
import { gameState, ICard } from '../../modules/game/game.state';
import './Deck.scss';

interface DeckState {
  cards : ICard[];
}

interface DeckProps {
  hidden? : boolean;
}

const Deck : FunctionComponent<DeckProps & DeckState> = ({ cards = [], hidden = false }) => (
  <div className="deck">
    { cards.map(({ number, suite }) => (
      <div key={ `${ number }.${ suite }` } className={ 'card ' + (hidden ? 'hidden' : '') }/>
    )) }
  </div>
);

export const PlayerDeck   = withObservableStream<DeckProps>({ cards: gameState.playerHand$ })(Deck);
export const ComputerDeck = withObservableStream<DeckProps>({ cards: gameState.computerHand$ })(Deck);
export const CenterDeck   = withObservableStream<DeckProps>({ cards: gameState.pile$ })(Deck);
