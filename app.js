const express = require("express");
const { WebSocketServer } = require("ws");
require('dotenv').config();

const app = express()
const port = process.env.PORT || 8080
const wssPort = process.env.WSS_PORT || 3001

// quiz started;
let quizStarted = false;
// User Sequence
let seq = 0
// User List
let userList = new Set();
// User's Answer List [{user, answer}]
let answerList = new Array();
// Quiz Answer List, is there any other way to hide answer list ??? instead of using env params...
const answerArr = [ process.env.ANSWER_1, process.env.ANSWER_2, process.env.ANSWER_3
    ,process.env.ANSWER_4, process.env.ANSWER_5, process.env.ANSWER_6
    ,process.env.ANSWER_7, process.env.ANSWER_8, process.env.ANSWER_9, process.env.ANSWER_10 ];

const http = require('http').createServer(app);

const wss = new WebSocketServer({ port: wssPort });
// const wss = new WebSocketServer({ server });
const dirName = `${__dirname}/public`
let pageNum = 1;

app.use(express.static("public"))

app.get('/adminLogin', (_, res) => {
    res.sendFile('adminLogin.html', { root: dirName })
})

app.get('/quizgame/2022/admin', (_, res) => {
    res.sendFile('admin.html', { root: dirName });
})

app.get('/start', (_, res) => {
    seq++;
    console.log(`person ${seq}`)
    // console.log(`start from quiz${pageNum}.html`);
    res.redirect(`/page/${pageNum}`);
})

app.get('/page/:num', (req, res) => {
    console.log(`will go to quiz${req.params.num}.html`);
    const getNum = Number(req.params.num);
    if (getNum === 0) {
        res.sendFile(`quiz1.html`, { root: dirName });
    } else if (getNum === 11) {
        res.sendFile(`quiz10.html`, { root: dirName });
    } else {
        res.sendFile(`quiz${getNum}.html`, { root: dirName });
    }
})

wss.broadcast = (message) => {
    wss.clients.forEach((client) => {
        // TODO: performace test
        // for(let i = 0; i < 50; i ++) {
            // console.log(`msg send${i}`);
            client.send(message);
        // }
    })
}


wss.on("connection", (ws, request) => {
    console.log(`how many people in here :${seq}`);
    wss.broadcast(`currentPage::${pageNum}::${quizStarted}`);
    wss.broadcast(`session::user${seq}`);
    // wss.clients.forEach(client => {
    //     // client.send(`how many users?? ${wss.clients.size}`)
    //     client.send(``)
    //     client.send(``);
    // });
    ws.on('message', data => {
        const msgArr = data.toString().split("::");
        const cmdType = msgArr[0];
        if (cmdType === 'admin') {
            console.log('admin action');
            const adminAction = msgArr[1];
            switch(adminAction) {
                case 'prev':
                    wss.broadcast('prev');
                    break;
                case 'next':
                    wss.broadcast('next');
                    break;
                case 'prevQuiz':
                    if (pageNum == 1) {
                        wss.broadcast('adminError::noPrevPage');
                    } else {
                        userList.clear();
                        answerList = [];
                        --pageNum;
                        wss.broadcast(`page::${pageNum}`);
                    }
                break;
                case 'nextQuiz':
                    if (pageNum == 10) {
                        wss.broadcast('adminError::noNextPage');
                    } else {
                        userList.clear();
                        answerList = [];
                        ++pageNum;
                        console.log('answerList init', answerList);
                        wss.broadcast(`page::${pageNum}`);              
                    }
                break;
                case 'lock':
                    wss.broadcast('control::lock');
                    break;
                case 'unlock':
                    wss.broadcast('control::unlock');
                    break;
                case 'countdown':
                    wss.broadcast('control::countdown');
                    break;
                case 'result':
                    getResult();
                    break;
                case 'show':
                    quizStarted = true;
                    wss.broadcast('control::show');
                    break;
                case 'init':
                    quizStarted = false;
                    pageNum = 1;
                    userList.clear();
                    answerList = []
                    break;
                case 'sessionClear':
                    seq = 0;
                    userList.clear();
                    answerList = [];
                    wss.broadcast('sessionClear');
                    break;
                    
            }
        } 
        if (cmdType === 'answer') {
            const user = msgArr[1];
            const answer = msgArr[2];
            // console.log(`answer clicked ${answer} from ${user}`)
            // console.log(`userList :`, userList);
            if (userList.has(user)) {
                // console.log('DUPLICATED!')
                answerList.map((data) => {
                    if (data.user === user) {
                        // console.log(`dataUser : ${data.user}  / user : ${user}`);
                        // console.log(`original Answer ${data.answer} / change Answer : ${answer}`);
                        data.answer = answer;
                    }
                })
            } else {
                const answerInfo = {user, answer};
                userList.add(user);
                answerList.push(answerInfo);
            }
        }
    })
})


function getResult() {
    console.log('answerList', answerList);
    console.log('answerList.cnt?', answerList.length);
    let answer1 = 0;
    let answer2 = 0;
    let answer3 = 0;
    let answer4 = 0;
    answerList.map((data) => {
        const answer = data.answer;
        switch(Number(answer)) {
            case 1:
                answer1++;
                break;
            case 2:
                answer2++;
                break;
            case 3:
                answer3++;
                break;
            case 4:
                answer4++;
                break;
        }
    })
    console.log(`Answer 1 : ${answer1} | Answer 2 : ${answer2} | Answer 3 : ${answer3} | Answer 4 : ${answer4}`);
    console.log(`Percentage : 1 - ${roundingOff(answer1)}% | 2 - ${roundingOff(answer2)}% | 3 - ${roundingOff(answer3)}% | 4 - ${roundingOff(answer4)}%`)
    console.log(`Answer Count : ${answerList.size}`)
    const resultArr = [roundingOff(answer1), roundingOff(answer2), roundingOff(answer3), roundingOff(answer4)]
    console.log(`CurPage is ${pageNum} Answer is ${answerArr[pageNum - 1]}`);
    wss.broadcast(`result::${answerArr[pageNum - 1]}::${answer1}人[${resultArr[0]}%],${answer2}人[${resultArr[1]}%],${answer3}人[${resultArr[2]}%],${answer4}人[${resultArr[3]}%]`)

}

const roundingOff = (num) => parseFloat(num / answerList.length * 100).toFixed(2);


http.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})