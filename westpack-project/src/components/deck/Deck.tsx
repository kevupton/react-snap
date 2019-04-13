import * as classnames from 'classnames';
import * as React from 'react';
import { FunctionComponent } from 'react';
import { combineLatest, merge, of } from 'rxjs';
import { delay, flatMap, map, shareReplay, startWith } from 'rxjs/operators';
import { withObservableStream } from '../../lib/observable-stream';
import { gameState, GameStatus, GameTurn, ICard } from '../../modules/game/game.state';
import { Card } from '../card/Card';
import './Deck.scss';

enum DeckStatus {
  DRAW          = 'draw',
  WINNER        = 'winner',
  UNKNOWN       = '',
  CURRENT_TURN  = 'current-turn',
  SNAPPED_RIGHT = 'snapped-right',
  SNAPPED_WRONG = 'snapped-wrong',
}

interface DeckState {
  cards : ICard[];
  round : number;
  status : DeckStatus;
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
    status = DeckStatus.UNKNOWN,
  },
) => {
  const classes = classnames('deck', {
    'no-delay': !animationDelay,
  }, status);
  return (
    <div className={ classes } onClick={ () => onClick() }>
      { cards.map((card) => (
        <Card key={ `${ card.number }.${ card.suite }.${ round }` } card={ card } hidden={ hidden }/>
      )) }
      { status === DeckStatus.WINNER && (
        <h2>WINNER</h2>
      ) }
      { status === DeckStatus.DRAW && (
        <h2>DRAW</h2>
      ) }
    </div>
  );
};

(window as any).test = gameState;

const statusObservable$ = combineLatest(
  gameState.gameStatus$,
  gameState.turn$,
  gameState.snapEvents$
    .pipe(
      startWith(null),
      // this piece is to cancel the event status after 1 second
      flatMap(event => {
        if (!event) {
          return of(event);
        }

        return merge(
          of(event),
          of(null)
            .pipe(delay(2000)),
        );
      }),
    ),
)
  .pipe(
    shareReplay(1),
  );

function getStatusFor$ (isPlayer = false) {
  return statusObservable$
    .pipe(
      map(([status, turn, event]) => {
        if (status === GameStatus.WIN && isPlayer ||
          status === GameStatus.LOSE && !isPlayer) {
          return DeckStatus.WINNER;
        }
        else if (status === GameStatus.DRAW) {
          return DeckStatus.DRAW;
        }
        else if (status !== GameStatus.STARTED) {
          return DeckStatus.UNKNOWN;
        }
        else if (event && event.isPlayer === isPlayer) {
          return event.isWin ? DeckStatus.SNAPPED_RIGHT : DeckStatus.SNAPPED_WRONG;
        }

        return turn === GameTurn.PLAYER && isPlayer ||
        turn === GameTurn.COMPUTER && !isPlayer ? DeckStatus.CURRENT_TURN : DeckStatus.UNKNOWN;
      }),
    );
}

const DeckWithRound = withObservableStream({ round: gameState.round$ })(Deck);

export const PlayerDeck   = withObservableStream<DeckProps>({
  cards: gameState.playerHand$,
  status: getStatusFor$(true),
})(DeckWithRound);
export const ComputerDeck = withObservableStream<DeckProps>({
  cards: gameState.computerHand$,
  status: getStatusFor$(false),
})(DeckWithRound);
export const CenterDeck   = withObservableStream<DeckProps>({
  cards: gameState.pile$,
})(DeckWithRound);
