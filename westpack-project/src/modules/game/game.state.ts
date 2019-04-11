import { BehaviorSubject, of, throwError } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

enum House {
  CLUBS,
  HEARTS,
  SPADES,
  DIAMONDS,
}

enum CardNumber {
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

enum GameStatus {
  READY,
  STARTED,
  WIN,
  LOSE
}

interface IGameData {
  computerHand : ICard[];
  playerHand : ICard[];
  pile : ICard[];
  botReactionTime : number;
  gameStatus : GameStatus;
}

interface ICard {
  house : House;
  cardNumber : CardNumber;
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

  private getKey$ (key : keyof IGameData) {
    return this.gameDataSubject.pipe(
      map(data => data.playerHand),
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
}

export const gameState = new GameState();
