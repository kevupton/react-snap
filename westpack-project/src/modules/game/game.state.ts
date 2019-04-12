import { BehaviorSubject, of, throwError } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import * as Clubs from './img/club.png';
import * as Hearts from './img/heart.png';
import * as Spades from './img/diamond.png';
import * as Diamonds from './img/spade.png';

export enum Suite {
  CLUBS = Clubs,
  HEARTS = Hearts,
  SPADES = Spades,
  DIAMONDS = Diamonds,
}

export enum CardNumber {
  ACE = 'A',
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  TEN = '10',
  JACK = 'J',
  QUEEN = 'Q',
  KING = 'K',
}

export enum GameStatus {
  READY,
  STARTED,
  WIN,
  LOSE,
  INITIALIZING
}

export interface IGameData {
  computerHand : ICard[];
  playerHand : ICard[];
  centerPile : ICard[];
  botReactionTime : number;
  gameStatus : GameStatus;
  round : number;
}

export interface ICard {
  suite : Suite;
  number : CardNumber;
}

const INITIAL_GAME_DATA : IGameData = {
  computerHand: [],
  playerHand: [],
  centerPile: [],
  botReactionTime: 2000,
  gameStatus: GameStatus.READY,
  round: 0,
};

class GameState {
  private readonly gameDataSubject = new BehaviorSubject<IGameData>(INITIAL_GAME_DATA);
  private readonly cardDeck        = this.generateDeck();

  get playerHand$ () {
    return this.getKey$('playerHand');
  }

  get computerHand$ () {
    return this.getKey$('computerHand');
  }

  get pile$ () {
    return this.getKey$('centerPile');
  }

  get gameStatus$ () {
    return this.getKey$('gameStatus');
  }

  get round$ () {
    return this.getKey$('round');
  }

  updateReactionTime (milliseconds : number) {
    this.gameDataSubject.next({
      ...this.gameDataSubject.value,
      botReactionTime: milliseconds,
    });
  }

  snapCards () {
    const gameData       = this.gameDataSubject.value;
    const { centerPile } = gameData;

    if (!centerPile.length) {
      return;
    }

    const isWin                              = centerPile.length >= 2 && centerPile[0].number === centerPile[1].number;
    const moveCenterPileTo : keyof IGameData = isWin ? 'computerHand' : 'playerHand';

    this.gameDataSubject.next({
      ...gameData,
      centerPile: [],
      [moveCenterPileTo]: [
        ...centerPile,
        ...gameData[moveCenterPileTo],
      ],
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

    const { round, botReactionTime } = this.gameDataSubject.value;

    this.gameDataSubject.next({
      ...INITIAL_GAME_DATA,
      playerHand,
      computerHand,
      round: round + 1,
      botReactionTime,
      gameStatus: GameStatus.STARTED,
    });
  }

  private getKey$ (key : keyof IGameData) {
    return this.gameDataSubject.pipe(
      map(data => data[key]),
      distinctUntilChanged(),
    );
  }

  private drawCard$ (key : 'playerHand' | 'computerHand') {
    const gameData = this.gameDataSubject.value;
    const hand = gameData[key];

    if (!hand.length) {
      return throwError(new Error(`There are no cards left in the ${ key } to draw.`));
    }

    const card    = hand[hand.length - 1];
    const newCenterPile = [
      ...gameData.centerPile,
      card,
    ];
    const newHand = gameData[key].slice(0, hand.length - 1);

    this.gameDataSubject.next({
      ...gameData,
      centerPile: newCenterPile,
      [key]: newHand,
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
}

export const gameState = new GameState();
