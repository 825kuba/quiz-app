'use strict';

const settingsEle = document.querySelector('.settings');
const settingsCategories = document.querySelector('.settings__category');
const settingsDifficulty = document.querySelectorAll('.difficulty');
const settingsNumOfQuestions = document.querySelectorAll('.num-questions');
const btnStart = document.querySelector('.settings__start');

const gameEle = document.querySelector('.game');
const questionEle = document.querySelector('.game__question');
const answersEle = document.querySelector('.game__answers');

class App {
  #categories = {};
  #settings = {};
  #questions = [];
  #index = 0;

  constructor() {
    this.#loadCategories();

    // EVENT LISTENERS
    btnStart.addEventListener('click', this.#startGame.bind(this));
  }

  async #loadCategories() {
    // GET API DATA FOR CATEGORIES
    try {
      const response = await fetch(`https://opentdb.com/api_category.php`);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      // SAVE THE CATEGORIES AND DISPLAY THEM IN FORM
      this.#categories = data.trivia_categories;
      console.log(this.#categories);
      this.#renderCategories();
    } catch (err) {
      console.error(err);
    }
  }

  #renderCategories() {
    // MARKUP FOR CATEGORY SELECT FORM
    settingsCategories.innerHTML = `
      <option value="">Any Category</option>
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
      console.log(this.#settings);
      //GET QUESTIONS FROM API
      await this.#loadQuestions();
      //RENDER THE FIRST QUESTION AND ANSWERS
      this.#renderQuestions();
      this.#renderAsnwers();
      //HIDE SETTINGS AND DISPLAY GAME
      settingsEle.classList.add('hidden');
      gameEle.classList.remove('hidden');
    } catch (err) {
      console.error(err);
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
      console.error(err);
    }
  }

  #renderQuestions() {
    if (!this.#questions.length) return;
    console.log('works');
    //DISPLAY THE CURRENT QUESTION
    questionEle.innerHTML = this.#questions[this.#index].question;
  }

  #renderAsnwers() {
    if (!this.#questions.length) return;
    //PUT ALL THE CURRENT ANSWERS TOGETHER
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
        <div class="game__answer">${answersShuffled[i]}</div>
        `
      );
    }
  }

  #renderSpinner(btn) {
    btn.innerHTML = `<i class="fas fa-cog"></i>`;
  }
}

const app = new App();
