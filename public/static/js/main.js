const ws = new WebSocket("ws://18.181.8.214:3001")
// const ws = new WebSocket("ws://localhost:3001");

const answerEls = document.getElementsByClassName('answerBtn');
const btnTxtEls = document.getElementsByClassName('btnTxt');
const resultEls = document.getElementsByClassName('quizResult');

const interfaceControl = (controlType) => {
    switch(controlType) {
        case 'lock':
            for(let i = 0; i < answerEls.length; i++) {
                answerEls[i].setAttribute('disabled', 'disabled');
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
        case 'show':
            document.getElementsByClassName('quizWrapper')[0].setAttribute('style', 'opacity: 1;');
            break;

    }
}

const showResult = (answerNum, resultData) => {
    const resultDataArr = String(resultData).split(',');
    // const displayEl = document.getElementsByClassName('quizResult');
    console.log(`answer is ${Number(answerNum)}`)
    for (let i = 0; i < resultEls.length; i++) {
        resultEls[i].innerHTML = `<br />${resultDataArr[i]}`;
        if (Number(answerNum) === Number(answerEls[i].getAttribute('value'))) {
            console.log('should be printed at least one time');
            answerEls[i].classList.add('right');
        } else {
            answerEls[i].classList.add('wrong');
            // resultEls[i].parentElement.classList.add('wrong');
        }
    }
}

ws.onmessage = (data) => {
    const dataArr = String(data.data).split('::');
    const cmdType = dataArr[0];
    if (cmdType === 'currentPage') {
        if(Number(dataArr[1]) === 1) {
            if(dataArr[2] == 'true') {
                document.getElementsByClassName('quizWrapper')[0].setAttribute('style', 'opacity: 1;');
            }
        }
        const openedPage = document.getElementById('curPage');
        if (openedPage && Number(dataArr[1]) !== Number(openedPage.getAttribute('value'))) {
            document.getElementsByClassName('quizWrapper')[0].remove();
            document.getElementsByClassName('notAvailable')[0].setAttribute('style', 'display: block');
        }
    }
    if (cmdType === 'page') {
        const targetPage = dataArr[1];
        const alink = document.createElement('a');
        console.log(`/page/${targetPage}`);
        alink.setAttribute('href', `/page/${Number(targetPage)}`);
        alink.click();
    }
    if (cmdType === 'character') {
        const targetPage = dataArr[1];
        const alink = document.createElement('a');
        alink.setAttribute('href', `/character/${targetPage}`);
        alink.click();
    }
    if(cmdType === 'prev') {
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
        } else {
            answerEls[i].removeAttribute('disabled');
            answerEls[i].removeAttribute('style');
            answerEls[i].classList.remove('clicked');
        }
    }
    const userId = window.sessionStorage.getItem('userID');
    ws.send(`answer::${userId}::${value}`);
}