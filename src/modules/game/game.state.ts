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
  DEALING = 'dealing',
  READY   = 'ready',
  STARTED = 'started',
  WIN     = 'win',
  LOSE    = 'lose',
  DRAW    = 'draw',
  PENDING = 'pending',
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
  rotation : number;
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
  public readonly centerPile$   = this.getKey$('centerPile');

  constructor () {
    this.registerDealingStatusWatcher();
    this.registerBotTurns();
    this.registerRoundCompletionChecker();
  }

  /**
   * Updates the bots reaction time.
   *
   * @param milliseconds
   */
  updateReactionTime (milliseconds : number) {
    this.botReactionTimeSubject.next(milliseconds);
  }

  /**
   * Attempts to snap the center pile. If there are not enough cards,
   * then it will do nothing.
   * Emits a snap event, whether it was successful or not.
   * Based on whether it was successful, it will move the centerPile into the
   * losers deck.
   *
   * @param isPlayer whether the person snapping is a player or a computer
   */
  snapCards (isPlayer = true) {
    const gameData                   = this.gameDataSubject.value;
    const { centerPile, gameStatus } = gameData;

    if (centerPile.length < 2 || gameStatus !== GameStatus.STARTED) {
      return;
    }

    const hands : ('computerHand' | 'playerHand')[] = ['computerHand', 'playerHand'];

    const isWin            = this.isValidSnap(centerPile);
    const moveCenterPileTo = hands[isWin ? +!isPlayer : +isPlayer];

    // move the centerPile to the loser
    this.gameDataSubject.next({
      ...gameData,
      centerPile: [],
      [moveCenterPileTo]: [
        ...centerPile.map(card => ({
          ...card,
          rotation: 0, // neaten the card back to center
        })),
        ...gameData[moveCenterPileTo],
      ],
    });

    // emit the snap event
    this.snapEventsSubject.next({
      isPlayer,
      isWin,
    });
  }

  /**
   * Draw a card from the players hand.
   */
  drawPlayerCard$ () {
    return this.drawCard$('playerHand');
  }

  /**
   * Draw a card from the computers hand.
   */
  drawComputerCard$ () {
    return this.drawCard$('computerHand');
  }

  /**
   * Completely resets the game,
   * except for the botReactionTime. This is used to stop playing.
   */
  reset () {
    this.gameDataSubject.next(INITIAL_GAME_DATA);
  }

  /**
   * Starts or restarts a new game.
   * Reshuffles the deck and splits it in half for each player.
   * Selects a random player to start with.
   */
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
      gameStatus: GameStatus.DEALING,
      turn: this.getRandomTurn(),
    });
  }

  /**
   * Gets a random turn.
   */
  private getRandomTurn () {
    const turns = [GameTurn.COMPUTER, GameTurn.PLAYER];
    return turns[Math.floor(Math.random() * turns.length)];
  }

  /**
   * Helper method for creating an observable that listens to
   * specific key changes on the gameDataSubject.
   * It will only emit a value if the previous value has changed. It will
   * also cache the previous value for any subsequent subscriptions.
   *
   * @param key
   */
  private getKey$<K extends keyof IGameData> (key : K) : Observable<IGameData[K]> {
    return this.gameDataSubject.pipe(
      map(data => data[key]),
      distinctUntilChanged(),
      shareReplay(1),
    );
  }

  /**
   * Draws a card from the specified hand.
   * If the game is over or there are no more cards, then it will not do anything.
   *
   * @param key
   */
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
      {
        ...card,
        rotation: (Math.random() * 40 - 20), // give the card some random rotation
      },
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

  /**
   * Shuffles the generated deck.
   * Returns a new deck with the cards in random order.
   */
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

  /**
   * Generates a deck of 52 cards.
   */
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
        rotation: 0,
      }))));

    return (<ICard[]>[]).concat(...cardsArray);
  }

  /**
   * Bot logic for taking an action.
   * First it will see if it can snap. If it can, then it will do it.
   * Then it will draw a card if it is its turn.
   * How quickly the bot does this depends on the `botReactionTime`.
   *
   * @param centerPile
   * @param turn
   */
  private takeComputerAction ({ centerPile, turn } : IGameData) {
    if (this.isValidSnap(centerPile)) {
      this.snapCards(false);
    }

    if (turn === GameTurn.COMPUTER) {
      this.drawComputerCard$();
    }
  }

  /**
   * Checks whether the given pile is snappable.
   * It is snappable when 2 numbers are the same.
   *
   * @param centerPile
   */
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

  /**
   * The logic for a bot to take a turn.
   * It will take the botReactionTime in milliseconds and then listen for updates on the gameDataSubject.
   * Once the turn has changed or the round has changed, then we want to wait the botReactionTime before we take
   * the computers action.
   * If the turn changes then the cooldown for the botReactionTime will be reset, and it will wait again.
   * It will only take this action if the game is in a started state.
   */
  private registerBotTurns () {
    this.botReactionTimeSubject
      .pipe(
        debounceTime(300),
        switchMap((milliseconds) => {
          return this.gameDataSubject.pipe(
            distinctUntilChanged((
              { round: roundA, turn: turnA, gameStatus: statusA },
              { round: roundB, turn: turnB, gameStatus: statusB },
              ) =>
              turnB === turnA &&
              roundB === roundA &&
              statusA === statusB, // so that the bot restarts on new game or new turn
            ),
            debounceTime(milliseconds),
          );
        }),
        filter(({ gameStatus }) => gameStatus === GameStatus.STARTED),
      )
      .subscribe((gameData) => this.takeComputerAction(gameData));
  }

  /**
   * This registers a watcher that checks whether the round is complete
   * only if the game has been started and the turn has changed.
   */
  private registerRoundCompletionChecker () {
    this.gameDataSubject.pipe(
      filter(({ gameStatus }) => gameStatus === GameStatus.STARTED),
      distinctUntilKeyChanged('turn'),
      delay(0), // this seems to be for a bug with rxjs. Required otherwise the end game events are reversed. *bug*
    )
      .subscribe(gameData => this.checkRoundCompletion(gameData));
  }

  /**
   * This watcher is responsible for waiting for the cards to be dealt.
   * Once the cards have been dealt then we change the status to started.
   */
  private registerDealingStatusWatcher () {
    const DEALING_DURATION = 2000;

    this.gameDataSubject.pipe(
      distinctUntilChanged((
        { gameStatus: gameStatusA, round: roundA },
        { gameStatus: gameStatusB, round: roundB },
        ) => roundA === roundB && gameStatusA === gameStatusB,
      ),
      filter(({ gameStatus }) => gameStatus === GameStatus.DEALING),
      // wait a specific amount of time for dealing to stop. This will reset if another round happens doing
      switchMap(() => of(null)
        .pipe(delay(DEALING_DURATION))),
    )
      .subscribe(() => {
        this.gameDataSubject.next({
          ...this.gameDataSubject.value,
          gameStatus: GameStatus.STARTED,
        });
      });
  }
}

export const gameState = new GameState();
