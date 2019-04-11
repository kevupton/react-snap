import { BehaviorSubject, of, throwError } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

export enum Suite {
  CLUBS,
  HEARTS,
  SPADES,
  DIAMONDS,
}

export enum CardNumber {
  ACE,
  TWO,
  THREE,
  FOUR,
  FIVE,
  SIX,
  SEVEN,
  EIGHT,
  NINE,
  TEN,
  JACK,
  QUEEN,
  KING,
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
  pile : ICard[];
  botReactionTime : number;
  gameStatus : GameStatus;
}

export interface ICard {
  suite : Suite;
  number : CardNumber;
}

const INITIAL_GAME_DATA : IGameData = {
  computerHand: [],
  playerHand: [],
  pile: [],
  botReactionTime: 2000,
  gameStatus: GameStatus.READY,
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
    return this.getKey$('pile');
  }

  get gameStatus$ () {
    return this.getKey$('gameStatus');
  }

  updateReactionTime (milliseconds : number) {
    this.gameDataSubject.next({
      ...this.gameDataSubject.value,
      botReactionTime: milliseconds,
    });
  }

  drawPlayerCard$ () {
    return this.drawCard$('playerHand');
  }

  drawComputerCard$ () {
    return this.drawCard$('computerHand');
  }

  reset () {
    this.gameDataSubject.next(INITIAL_GAME_DATA); // TODO dont change the reaction time property
  }

  public setup () {
    const shuffledDeck = this.shuffleDeck();

    const playerHand   = shuffledDeck.splice(0, this.cardDeck.length / 2);
    const computerHand = shuffledDeck;

    this.gameDataSubject.next({
      ...INITIAL_GAME_DATA,
      playerHand,
      computerHand,
      gameStatus: GameStatus.READY,
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

    if (!gameData[key].length) {
      return throwError(new Error(`There are no cards left in the ${ key } to draw.`));
    }

    const card    = gameData[key][0];
    const newPile = [
      card,
      ...gameData.pile,
    ];
    const newHand = gameData[key].slice(1);

    this.gameDataSubject.next({
      ...gameData,
      pile: newPile,
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
