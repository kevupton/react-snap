import { BehaviorSubject, Observable, of, Subject, throwError } from 'rxjs';
import {
  debounceTime,
  delay,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  map,
  shareReplay,
  switchMap,
} from 'rxjs/operators';
import * as Clubs from './img/club.png';
import * as Spades from './img/diamond.png';
import * as Hearts from './img/heart.png';
import * as Diamonds from './img/spade.png';

export enum Suite {
  CLUBS    = Clubs,
  HEARTS   = Hearts,
  SPADES   = Spades,
  DIAMONDS = Diamonds,
}

export enum CardNumber {
  ACE   = 'A',
  TWO   = '2',
  THREE = '3',
  FOUR  = '4',
  FIVE  = '5',
  SIX   = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE  = '9',
  TEN   = '10',
  JACK  = 'J',
  QUEEN = 'Q',
  KING  = 'K',
}

export enum GameStatus {
  READY,
  STARTED,
  WIN,
  LOSE,
  DRAW,
  INITIALIZING
}

export interface IGameData {
  computerHand : ICard[];
  playerHand : ICard[];
  centerPile : ICard[];
  gameStatus : GameStatus;
  round : number;
  turn : GameTurn;
}

export interface ICard {
  suite : Suite;
  number : CardNumber;
}

export enum GameTurn {
  PLAYER,
  COMPUTER,
}

export interface ISnapEvent {
  isPlayer : boolean;
  isWin : boolean;
}

const INITIAL_GAME_DATA : IGameData = {
  computerHand: [],
  playerHand: [],
  centerPile: [],
  gameStatus: GameStatus.READY,
  round: 0,
  turn: GameTurn.PLAYER,
};

class GameState {

  private readonly gameDataSubject        = new BehaviorSubject<IGameData>(INITIAL_GAME_DATA);
  private readonly botReactionTimeSubject = new BehaviorSubject(1000);
  public readonly botReactionTime$        = this.botReactionTimeSubject.asObservable();
  private readonly snapEventsSubject      = new Subject<ISnapEvent>();
  public readonly snapEvents$             = this.snapEventsSubject.asObservable();
  private readonly cardDeck               = this.generateDeck();

  public readonly playerHand$   = this.getKey$('playerHand');
  public readonly computerHand$ = this.getKey$('computerHand');
  public readonly pile$         = this.getKey$('centerPile');
  public readonly gameStatus$   = this.getKey$('gameStatus');
  public readonly round$        = this.getKey$('round');
  public readonly turn$         = this.getKey$('turn');

  constructor () {
    this.botReactionTimeSubject
      .pipe(
        debounceTime(300),
        switchMap((milliseconds) => {
          return this.gameDataSubject.pipe(
            distinctUntilChanged((
              { round: roundA, turn: turnA },
              { round: roundB, turn: turnB }, // so that the bot restarts on new game
              ) => `${ roundA }.${ turnA }` === `${ roundB }.${ turnB }`,
            ),
            debounceTime(milliseconds),
          );
        }),
        filter(({ gameStatus }) => gameStatus === GameStatus.STARTED),
      )
      .subscribe((gameData) => this.takeComputerTurn(gameData));

    // win lose event watcher
    this.gameDataSubject.pipe(
      filter(({ gameStatus }) => gameStatus === GameStatus.STARTED),
      distinctUntilKeyChanged('turn'),
      delay(0),
    )
      .subscribe(gameData => this.checkRoundCompletion(gameData));
  }

  updateReactionTime (milliseconds : number) {
    this.botReactionTimeSubject.next(milliseconds);
  }

  snapCards (isPlayer = true) {
    const gameData                   = this.gameDataSubject.value;
    const { centerPile, gameStatus } = gameData;

    if (centerPile.length < 2 || gameStatus !== GameStatus.STARTED) {
      return;
    }

    const hands : ('computerHand' | 'playerHand')[] = ['computerHand', 'playerHand'];

    const isWin            = this.isValidSnap(centerPile);
    const moveCenterPileTo = hands[isWin ? +!isPlayer : +isPlayer];

    this.gameDataSubject.next({
      ...gameData,
      centerPile: [],
      [moveCenterPileTo]: [
        ...centerPile,
        ...gameData[moveCenterPileTo],
      ],
    });

    this.snapEventsSubject.next({
      isPlayer,
      isWin,
    });
  }

  drawPlayerCard$ () {
    return this.drawCard$('playerHand');
  }

  drawComputerCard$ () {
    return this.drawCard$('computerHand');
  }

  reset () {
    this.gameDataSubject.next(INITIAL_GAME_DATA);
  }

  public startNewGame () {
    const shuffledDeck = this.shuffleDeck();

    const playerHand   = shuffledDeck.splice(0, this.cardDeck.length / 2);
    const computerHand = shuffledDeck;

    const { round } = this.gameDataSubject.value;

    this.gameDataSubject.next({
      centerPile: [],
      playerHand,
      computerHand,
      round: round + 1,
      gameStatus: GameStatus.STARTED,
      turn: this.getRandomTurn(),
    });
  }

  private getRandomTurn () {
    return [GameTurn.COMPUTER, GameTurn.PLAYER][Math.floor(Math.random() * 2)];
  }

  private getKey$<K extends keyof IGameData> (key : K) : Observable<IGameData[K]> {
    return this.gameDataSubject.pipe(
      map(data => data[key]),
      distinctUntilChanged(),
      shareReplay(1),
    );
  }

  private drawCard$ (key : 'playerHand' | 'computerHand') {
    const gameData = this.gameDataSubject.value;
    const hand     = gameData[key];

    // prevent drawing a card if its not the players turn.
    if (key === 'playerHand' && gameData.turn === GameTurn.COMPUTER ||
      key === 'computerHand' && gameData.turn === GameTurn.PLAYER) {
      return;
    }

    if (!hand.length) {
      return throwError(new Error(`There are no cards left in the ${ key } to draw.`));
    }

    const card          = hand[hand.length - 1];
    const newCenterPile = [
      ...gameData.centerPile,
      card,
    ];
    const newHand       = gameData[key].slice(0, hand.length - 1);

    this.gameDataSubject.next({
      ...gameData,
      centerPile: newCenterPile,
      [key]: newHand,
      turn: gameData.turn === GameTurn.COMPUTER ? GameTurn.PLAYER : GameTurn.COMPUTER,
    });

    return of(card);
  }

  private shuffleDeck () {
    // map to an array of 0...52
    const indexes  = Array.from(Array(this.cardDeck.length))
      .map((value, i) => i);
    const shuffled = [];

    while (indexes.length > 0) {
      const randomIndex     = Math.floor(Math.random() * indexes.length); // floor because it is the indexes
      const randomCardIndex = indexes.splice(randomIndex, 1)[0];
      const randomCard      = this.cardDeck[randomCardIndex];

      shuffled.push(randomCard);
    }

    return shuffled;
  }

  private generateDeck () : ICard[] {
    const numbers : CardNumber[] = [
      CardNumber.ACE,
      CardNumber.TWO,
      CardNumber.THREE,
      CardNumber.FOUR,
      CardNumber.FIVE,
      CardNumber.SIX,
      CardNumber.SEVEN,
      CardNumber.EIGHT,
      CardNumber.NINE,
      CardNumber.TEN,
      CardNumber.JACK,
      CardNumber.QUEEN,
      CardNumber.KING,
    ];

    const suites : Suite[] = [
      Suite.CLUBS,
      Suite.DIAMONDS,
      Suite.HEARTS,
      Suite.SPADES,
    ];

    const cardsArray = (suites.map(suite =>
      numbers.map(number => (<ICard>{
        number,
        suite,
      }))));

    return (<ICard[]>[]).concat(...cardsArray);
  }

  private takeComputerTurn ({ centerPile, turn } : IGameData) {
    if (this.isValidSnap(centerPile)) {
      this.snapCards(false);
    }

    if (turn === GameTurn.COMPUTER) {
      this.drawComputerCard$();
    }
  }

  private isValidSnap (centerPile : ICard[]) {
    if (centerPile.length < 2) {
      return false;
    }

    return centerPile[centerPile.length - 2].number === centerPile[centerPile.length - 1].number;
  }

  private checkRoundCompletion ({ turn, playerHand, computerHand, centerPile } : IGameData) {
    // if there is a match we dont want to do anything.
    if (this.isValidSnap(centerPile)) {
      return;
    }

    let outcome : GameStatus;
    if (playerHand.length === 0 && computerHand.length === 0) {
      outcome = GameStatus.DRAW;
    }
    else if (turn === GameTurn.PLAYER && playerHand.length === 0) {
      outcome = GameStatus.WIN;
    }
    else if (turn === GameTurn.COMPUTER && computerHand.length === 0) {
      outcome = GameStatus.LOSE;
    }
    else {
      return;
    }

    this.gameDataSubject.next({
      ...this.gameDataSubject.value,
      gameStatus: outcome,
    });
  }
}

export const gameState = new GameState();
