const $time = document.querySelector('time');
const $paragraph = document.querySelector('p');
const $input = document.querySelector('input');
const $game = document.querySelector('#game')
const $results = document.querySelector('#results')
const $wpm = $results.querySelector('#results-wpm')
const $accuracy = $results.querySelector('#results-accuracy')
const $letters = $results.querySelector('#results-letter')
const $button = document.querySelector('#reload-button')
const $toggleModeButton = document.querySelector('#toggle-mode-button');
const $body = document.body;

const INITIAL_TIME = 30;
const url = 'https://raw.githubusercontent.com/javierarce/palabras/master/listado-general.txt';

$toggleModeButton.addEventListener('click', () => {
    $body.classList.toggle('light-mode');
    const isLightMode = $body.classList.contains('light-mode');
    if (isLightMode) {
        localStorage.setItem('lightMode', 'true');
    } else {
        localStorage.removeItem('lightMode');
    }
});


const TEXT = 'quick brown fox jumps over the lazy dog and midudev is trying to clone monkey type for fun and profit using vanilla js for the typing test speed';

let words = [];
let currentTime = INITIAL_TIME;

fetchWords();

async function fetchWords() {
    try {
        const response = await fetch(url);
        const data = await response.text();
        const allWords = data.split('\n');
        const totalWords = allWords.length;
        const randomIndices = [];

        while (randomIndices.length < 200) {
            const index = Math.floor(Math.random() * totalWords);
            if (!randomIndices.includes(index)) {
                randomIndices.push(index);
            }
        }

        words = randomIndices.map(index => allWords[index]);
        initGame()
    } catch (error) {
        console.error('Error fetching words:', error);
    }
}


function getRandomWords(count) {
    const randomWords = [];
    for (let i = 0; i < count; i++) {
        const index = Math.floor(Math.random() * words.length);
        randomWords.push(words.splice(index, 1)[0]);
    }
    return randomWords;
}

function initGame() {
    initEvents();
    $game.style.display = 'flex';
    $results.style.display = 'none';
    $input.value = '';

    currentTime = INITIAL_TIME;

    $time.textContent = currentTime;

    const words = getRandomWords(32); // Obtener palabras aleatorias de forma síncrona

    const wordsHTML = words.map((word, index) => {
        const letters = word.split('');
        return `<x-word>
            ${letters.map(letter => `<x-letter>${letter}</x-letter>`)
                .join('')
            }
        </x-word>`;
    }).join('');

    $paragraph.innerHTML = wordsHTML;

    const $firstWord = $paragraph.querySelector('x-word');
    $firstWord.classList.add('active');
    $firstWord.querySelector('x-letter').classList.add('active');

    const intervalId = setInterval(() => {
        currentTime--;
        $time.textContent = currentTime;

        if (currentTime === 0) {
            clearInterval(intervalId);
            gameOver();
        }
    }, 1000);
}

function initEvents() {
    document.addEventListener('keydown', () => {
        $input.focus()
    })
    $input.addEventListener('keydown', onKeyDown)
    $input.addEventListener('keyup', onKeyUp)
    $button.addEventListener('click', initGame)
}

function onKeyDown(event) {
    const $currentWord = $paragraph.querySelector('x-word.active')
    const $currentLetter = $currentWord.querySelector('x-letter.active')

    const { key } = event
    if (key === ' ') {
        event.preventDefault()

        const $nextWord = $currentWord.nextElementSibling
        const $nextLetter = $nextWord.querySelector('x-letter')

        $currentWord.classList.remove('active', 'marked')
        $currentLetter.classList.remove('active')

        $nextWord.classList.add('active')
        $nextLetter.classList.add('active')

        $input.value = ''

        const hasMissedLetters = $currentWord
            .querySelectorAll('x-letter:not(.correct)').length > 0

        const classToAdd = hasMissedLetters ? 'marked' : 'correct'
        $currentWord.classList.add(classToAdd)
    }

    if (key === 'Backspace') {
        const $prevWord = $currentWord.previousElementSibling
        const $prevLetter = $currentLetter.previousElementSibling

        if (!$prevWord && !$prevLetter) {
            event.preventDefault()
            return
        }

        const $wordMarked = $paragraph.querySelector('x-word.marked')

        if ($wordMarked && !$prevLetter) {
            event.preventDefault()
            $prevWord.classList.remove('marked')
            $prevWord.classList.add('active')

            const $letterToGo = $prevWord.querySelector('x-letter:last-child')

            $currentLetter.classList.remove('active')
            $letterToGo.classList.add('active')

            $input.value = [
                ...$prevWord.querySelectorAll('x-letter.correct, x-letter.incorrect')
            ].map($el => {
                return $el.classList.contains('correct') ? $el.innerText : '*'
            }).join('')
        }
    }
}

function onKeyUp() {
    const $currentWord = $paragraph.querySelector('x-word.active')
    const $currentLetter = $currentWord.querySelector('x-letter.active')

    const currentWord = $currentWord.innerText.trim()
    $input.maxLength = currentWord.length

    const $allLetters = $currentWord.querySelectorAll('x-letter')
    $allLetters.forEach($letter => $letter.classList.remove('correct', 'incorrect'))

    $input.value.split('').forEach((char, index) => {
        const $letter = $allLetters[index]
        const letterToCheck = currentWord[index]

        const isCorrect = char === letterToCheck
        const letterClass = isCorrect ? 'correct' : 'incorrect'
        $letter.classList.add(letterClass)
    })

    $currentLetter.classList.remove('active', 'is-last')
    const inputLength = $input.value.length
    const $nextActiveLetter = $allLetters[inputLength]

    if ($nextActiveLetter) {
        $nextActiveLetter.classList.add('active')
    } else {
        $currentLetter.classList.add('active', 'is-last')
    }
}

function gameOver() {
    $game.style.display = 'none'
    $results.style.display = 'flex'

    const correctWords = $paragraph.querySelectorAll('x-word.correct').length
    const correctLetters = $paragraph.querySelectorAll('x-letter.correct').length
    const incorrectLetters = $paragraph.querySelectorAll('x-letter.incorrect').length

    const totalLetters = correctLetters + incorrectLetters
    const totalLettersEntered = $paragraph.querySelectorAll('x-letter.correct, x-letter.incorrect').length;

    const accuracy = totalLettersEntered > 0 ? (correctLetters / totalLettersEntered) * 100 : 0;

    const wpm = correctWords * 60 / INITIAL_TIME
    $wpm.textContent = wpm
    $accuracy.textContent = `${accuracy.toFixed(2)}%`
    $letters.textContent = `${correctLetters} / ${totalLetters}`;
}

document.addEventListener('DOMContentLoaded', function () {
    const isLightMode = localStorage.getItem('lightMode') === 'true';
    if (isLightMode) {
        document.body.classList.add('light-mode');
    }
});