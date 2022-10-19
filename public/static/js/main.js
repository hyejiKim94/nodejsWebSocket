// const ws = new WebSocket("ws://18.183.77.192:3001")
const ws = new WebSocket("ws://localhost:3001", 'a');

const answerEls = document.getElementsByClassName('answerBtn');
const btnTxtEls = document.getElementsByClassName('btnTxt');
const resultEls = document.getElementsByClassName('quizResult');

const interfaceControl = (controlType) => {
    switch(controlType) {
        case 'lock':
            console.log('lock   ', answerEls.length);
            for(let i = 0; i < answerEls.length; i++) {
                answerEls[i].setAttribute('disabled', 'disabled');
                answerEls[i].removeAttribute('value');
                answerEls[i].removeAttribute('onclick');
            }
            break;
        case 'unlock':
            for(let i = 0; i < answerEls.length; i++) {
                answerEls[i].removeAttribute('disabled');
                answerEls[i].removeAttribute('style');
                answerEls[i].setAttribute('value', Number(i + 1));
                answerEls[i].setAttribute('onclick', `answerBtn(this.value)`);
                answerEls[i].classList.remove('clicked');
                btnTxtEls[i].classList.remove('right');
                btnTxtEls[i].classList.remove('wrong');
                resultEls[i].innerHTML = '';
            }
            break;
        case 'countdown':
            const display = document.getElementById('countdown');
            let count = 10;
            setTimeout(() => {
                display.setAttribute('style', 'opacity: 1');
            }, 1000);
            const displayCountdown = setInterval(() => {
                display.innerHTML = count;
                if (count-- == 0) {
                    ws.send('admin::lock');
                    clearInterval(displayCountdown);
                }
            }, 1000);
            break;
    }
}

const showResult = (answerNum, resultData) => {
    console.log('answer', answerNum);
    const resultDataArr = String(resultData).split(',');
    console.log('result Data', resultDataArr);
    // const displayEl = document.getElementsByClassName('quizResult');
    for (let i = 0; i < resultEls.length; i++) {
        resultEls[i].innerHTML = resultDataArr[i];
        if (Number(answerNum) === i + 1) {
            resultEls[i].parentElement.classList.add('right');
        } else {
            resultEls[i].parentElement.classList.add('wrong');
        }
    }
}

function answerBtn(value) {
    // const answerEls = document.getElementsByClassName('answerBtn');
    for(let i = 0; i < answerEls.length; i++) {
        if (value == i + 1) {
            answerEls[i].setAttribute('disabled', 'disabled');
            answerEls[i].classList.add('clicked');
            console.log(answerEls[i].classList)
        } else {
            answerEls[i].removeAttribute('disabled');
            answerEls[i].removeAttribute('style');
            answerEls[i].classList.remove('clicked');
        }
    }
    const userId = window.sessionStorage.getItem('userID');
    console.log('userID :', userId);
    ws.send(`answer::${userId}::${value}`);
}