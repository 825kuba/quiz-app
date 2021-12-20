'use strict';

const container = document.querySelector('.container');

const settingsEle = document.querySelector('.settings');
const settingsCategories = document.querySelector('.settings__category');
const settingsDifficulty = document.querySelectorAll('.difficulty');
const settingsNumOfQuestions = document.querySelectorAll('.num-questions');
const btnStart = document.querySelector('.settings__start');

const gameEle = document.querySelector('.game');
const questionEle = document.querySelector('.game__question');
const answersEle = document.querySelector('.game__answers');
const btnNext = document.querySelector('.game__next');
const pageIndex = document.querySelector('.game__page');

const scoreEle = document.querySelector('.score');
const scoreMsgEle = document.querySelector('.score__message');

const errorEle = document.querySelector('.error');
const errorMsgEle = document.querySelector('.error__message');

const btnAgain = document.querySelectorAll('.btn--again');

const quitGameEle = document.querySelector('.quit-game');
const btnQuitGame = document.querySelector('.quit-game__btn');
const quitGameMsgEle = document.querySelector('.quit-game__modal');

class App {
  #categories = {};
  #settings = {};
  #questions = [];
  #index = 0;
  #score = 0;

  constructor() {
    // GET CATEGORIES FROM API
    this.#loadCategories();

    // EVENT LISTENERS
    btnStart.addEventListener('click', this.#startGame.bind(this));
    answersEle.addEventListener('click', this.#checkAnswer.bind(this));
    btnNext.addEventListener('click', this.#nextQuestion.bind(this));
    Array.from(btnAgain).forEach(btn => {
      btn.addEventListener('click', this.#resetGame.bind(this));
    });
    btnQuitGame.addEventListener(
      'click',
      function () {
        quitGameMsgEle.classList.remove('hidden');
      }.bind(this)
    );
    quitGameMsgEle.addEventListener('click', this.#quitGame.bind(this));
  }

  async #loadCategories() {
    // GET API DATA FOR CATEGORIES
    try {
      const response = await fetch(`https://opentdb.com/api_category.php`);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      // SAVE THE CATEGORIES AND DISPLAY THEM IN FORM
      this.#categories = data.trivia_categories;
      this.#renderCategories();
      btnStart.disabled = false;
    } catch (err) {
      this.#renderError(err);
    }
  }

  #renderCategories() {
    // MARKUP FOR CATEGORY SELECT FORM
    settingsCategories.innerHTML = `
      <option selected value="">All Categories</option>
    `;
    this.#categories.forEach(cat =>
      settingsCategories.insertAdjacentHTML(
        'beforeend',
        `
          <option value="${cat.id}">${cat.name}</option>
        `
      )
    );
  }

  #getSettings() {
    // GET CATEGORY SETTINGS
    this.#settings.category = settingsCategories.value;
    // GET DIFFICULTY SETTINGS
    for (let i = 0; i < settingsDifficulty.length; i++) {
      if (settingsDifficulty[i].checked)
        this.#settings.difficulty = settingsDifficulty[i].value;
    }
    // GET NUMBER OF QUESTIONS SETTINGS
    for (let i = 0; i < settingsNumOfQuestions.length; i++) {
      if (settingsNumOfQuestions[i].checked)
        this.#settings.numOfQuestions = settingsNumOfQuestions[i].value;
    }
  }

  async #startGame(e) {
    try {
      e.preventDefault();
      // IF NO CATEGORIES LOADED YET, RETURN
      if (!this.#categories) return;
      //RENDER SPINNER
      this.#renderSpinner(btnStart);
      //SAVE SETTINGS
      this.#getSettings();
      //GET QUESTIONS FROM API
      await this.#loadQuestions();
      //RENDER THE GAME
      this.#renderGame();
    } catch (err) {
      this.#renderError(err);
    }
  }

  async #loadQuestions() {
    try {
      const response = await fetch(
        `https://opentdb.com/api.php?amount=${
          this.#settings.numOfQuestions
        }&category=${this.#settings.category}&difficulty=${
          this.#settings.difficulty
        }`
      );
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      // IF THERE ARE NO QUESTIONS FROM THE API, THROW ERROR
      if (!data.results.length)
        throw new Error(`No questions for this topic :(`);
      // SAVE QUESTIONS
      this.#questions = data.results;
    } catch (err) {
      this.#renderError(err);
    }
  }

  #renderGame() {
    this.#renderQuestions();
    this.#renderAsnwers();
    this.#renderPageIndex();
    //HIDE SETTINGS AND DISPLAY GAME
    settingsEle.classList.add('hidden');
    gameEle.classList.remove('hidden');
    quitGameEle.classList.remove('hidden');
  }

  #renderQuestions() {
    if (!this.#questions.length) return;
    //DISPLAY THE CURRENT QUESTION
    questionEle.innerHTML = this.#questions[this.#index].question;
  }

  #renderAsnwers() {
    if (!this.#questions.length) return;
    //PUT ALL THE CURRENT ANSWERS IN ONE ARRAY
    const answers = [
      this.#questions[this.#index].correct_answer,
      ...this.#questions[this.#index].incorrect_answers,
    ];
    // SHUFFLE QUESTIONS
    const shuffle = array => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
      }
      return array;
    };
    const answersShuffled = shuffle(answers);
    //DISPLAY QUESTIONS
    answersEle.innerHTML = '';
    for (let i = 0; i < answersShuffled.length; i++) {
      answersEle.insertAdjacentHTML(
        'beforeend',
        `
        <button class="game__answer">${answersShuffled[i]}</button>
        `
      );
    }
  }

  #renderPageIndex() {
    pageIndex.textContent = `
      ${this.#index + 1}/${this.#questions.length}
    `;
  }

  #decodeHTML(str) {
    // API RETURN DATA IN ENCODED FORMAT (HTML CODES), SO WE NEED TO DECODE IT TO BE ABLE TO COMPARE USER ANSWER WITH THE CORRECT ONE
    const temp = document.createElement('p');
    temp.innerHTML = str;
    return temp.innerText;
  }

  #checkAnswer(e) {
    const target = e.target;
    if (!target.classList.contains('game__answer')) return;
    //GET THE USERS ANSWER
    const answer = target.innerText;
    //CHECK IF IT IS CORRECT
    if (
      answer === this.#decodeHTML(this.#questions[this.#index].correct_answer)
    )
      //IF YES, DISPLAY SUCCES
      this.#correctAnswer(target);
    //IF NOT, DISPLAY MISTAKE
    else this.#wrongAnswer(target);
    //SHOW CORRECT ANSWER
    this.#showCorrect();
    //ENABLE NEXT BUTTON
    btnNext.disabled = false;
  }

  #correctAnswer(element) {
    //INCREASE SCORE FOR CORRECT ANSWER
    this.#score++;
    //DISPLAY DESIRED STYLES
    element.classList.add('correct');
    container.classList.add('correct');
    //DISABLE ANSWERS
    this.#disableAnswers(true);
  }

  #wrongAnswer(element) {
    //DISPLAY DESIRED STYLES
    element.classList.add('wrong');
    container.classList.add('wrong');
    //DISABLE ANSWERS
    this.#disableAnswers(true);
  }

  #disableAnswers(boolean) {
    //PREVENT CLICKING ON MORE ANSWERS AFTER USER CLICKS ONE
    Array.from(answersEle.children).forEach(ele => (ele.disabled = boolean));
  }

  #showCorrect() {
    //MARK THE CORRECT ANSWER
    Array.from(answersEle.children).forEach(ele => {
      if (
        ele.innerText ===
        this.#decodeHTML(this.#questions[this.#index].correct_answer)
      )
        ele.classList.add('correct');
    });
  }

  #nextQuestion() {
    //RESET COLOR STYLES
    container.classList.remove('correct');
    container.classList.remove('wrong');
    //IF LAST QUESTIONS IS CURRENTLY DISPLAYED, SHOW SCORE
    if (this.#index === this.#questions.length - 1) this.#renderScore();
    // ELSE INCREASE INDEX AND RENDER NEW QUESTION
    else {
      this.#index++;
      this.#renderGame();
      btnNext.disabled = true;
    }
  }

  #renderScore() {
    //CREATE DIFFERENT STRINGS DEPENDING ON SCORE
    const rank = perc => {
      if (perc <= 20) return `You don't know anything!`;
      if (perc > 20 && perc <= 40) return `Barely made it...`;
      if (perc > 40 && perc <= 60) return `Pretty average...`;
      if (perc > 60 && perc <= 80) return `You did great!`;
      if (perc > 80 && perc <= 100) return `You're a walking encyclopedia!`;
    };
    //COUNT USER'S SCORE
    const percentage = Math.round((this.#score / this.#questions.length) * 100);
    //MARKUP FOR SCORE MESSAGE
    scoreMsgEle.innerHTML = `
    <p class="score__rate">${this.#score} out of ${this.#questions.length}</p>
    <p class="score__perc">${percentage}%</p>
      <p class="score__rank">${rank(percentage)}</p>
    `;
    //HIDE GAME AND SHOW SCORE
    gameEle.classList.add('hidden');
    scoreEle.classList.remove('hidden');
    quitGameEle.classList.add('hidden');
  }

  #renderSpinner(btn) {
    btn.innerHTML = `<i class="fas fa-cog"></i>`;
  }

  #renderError(err) {
    errorMsgEle.textContent = `${err}`;
    errorEle.classList.remove('hidden');
  }

  #resetGame() {
    //RESET AND EMPTY GAME DATA
    this.#score = 0;
    this.#index = 0;
    this.#settings = {};
    this.#questions = [];
    //EMPTY GAME ELEMENTS
    questionEle.innerHTML = '';
    answersEle.innerHTML = '';
    pageIndex.innerHTML = '';
    btnStart.innerHTML = 'Start';
    //RESET FORM
    settingsEle.reset();
    //SHOW SETTINGS AND HIDE EVERYTHING ELSE
    gameEle.classList.add('hidden');
    settingsEle.classList.remove('hidden');
    errorEle.classList.add('hidden');
    scoreEle.classList.add('hidden');
    quitGameEle.classList.add('hidden');
    quitGameMsgEle.classList.add('hidden');
    container.classList.remove('correct', 'wrong');
    btnNext.disabled = true;
  }

  #quitGame(e) {
    const target = e.target;
    if (!target) return;
    //IF TARGET IF YES BTN, RESET GAME
    if (target.classList.contains('quit-game__option--yes')) this.#resetGame();
    //IF TARGET IS NO BTN, HIDE QUIT MESSAGE
    if (target.classList.contains('quit-game__option--no'))
      quitGameMsgEle.classList.add('hidden');
  }
}

const app = new App();
