const ws = new WebSocket("ws://18.183.77.192:3001")
// const ws = new WebSocket("ws://localhost:3001");

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

ws.onmessage = (data) => {
    const dataArr = String(data.data).split('::');
    const cmdType = dataArr[0];
    // if (cmdType === 'page') {
    //     location.href='/page';
    // }
    console.log(`dataArr`, dataArr);
    if (cmdType === 'currentPage') {
        console.log(`currentPage is ${dataArr[1]}`);
        const openedPage = document.getElementById('curPage').getAttribute('value');
        if (Number(dataArr[1]) !== Number(openedPage)) {
            console.log('page is not matched');
            document.getElementsByClassName('quizWrapper')[0].remove();
            document.getElementsByClassName('notAvailable')[0].setAttribute('style', 'opacity: 1');
        }

    }
    if (cmdType === 'page') {
        const targetPage = dataArr[1];
        const alink = document.createElement('a');
        alink.setAttribute('href', `/page/${Number(targetPage)}`);
        alink.click();
    }
    if(cmdType === 'prev') {
        console.log('prev come??');
        const alink = document.createElement('a');
        const curPage = document.getElementById('curPage').getAttribute('value');
        alink.setAttribute('href', `/page/${Number(curPage)-1}`);
        alink.click();
    }
    if(cmdType === 'next') {
        const alink = document.createElement('a');
        const curPage = document.getElementById('curPage').getAttribute('value');
        alink.setAttribute('href', `/page/${Number(curPage)+1}`);
        alink.click();
    }
    if (cmdType === 'session') {
        console.log('get session', window.sessionStorage.getItem('userID'));
        if (!window.sessionStorage.getItem('userID')) {
            window.sessionStorage.setItem('userID', dataArr[1]);
        }
    }
    if (cmdType === 'sessionClear') {
        if (window.sessionStorage.getItem('userID')) {
            window.sessionStorage.removeItem('userID');
        }
    }
    if (cmdType === 'control') {
        const controlType = dataArr[1];
        interfaceControl(controlType);
    }
    if (cmdType === 'result') {
        showResult(dataArr[1], dataArr[2]);
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