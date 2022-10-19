const express = require("express");
const { WebSocketServer } = require("ws");
require('dotenv').config();

const app = express()
const port = process.env.PORT || 3000
const wssPort = process.env.WSS_PORT || 3001


const http = require('http').createServer(app);

const wss = new WebSocketServer({ port: wssPort });
// const wss = new WebSocketServer({ server });
const dirName = `${__dirname}/public`
let pageNum = 1;

app.use(express.static("public"))

app.get('/adminLogin', (_, res) => {
    res.sendFile('adminLogin.html', { root: dirName })
})

app.get('/admin', (_, res) => {
    res.sendFile('admin.html', { root: dirName });
})

app.get('/page', (_, res) => {
    console.log(`html go to quiz${pageNum}.html`);
    console.log(`root Dir: ${dirName}`);
    res.sendFile(`quiz${pageNum}.html`, { root: dirName });
})

wss.broadcast = (message) => {
    wss.clients.forEach((client) => {
        client.send(message);
    })
}

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


wss.on("connection", (ws, request) => {
    seq++;
    wss.clients.forEach(client => {
        client.send(`how many users?? ${wss.clients.size}`)
        client.send(`session::user${seq}`)
    });
    ws.on('message', data => {
        const msgArr = data.toString().split("::");
        const cmdType = msgArr[0];
        if (cmdType === 'admin') {
            const adminAction = msgArr[1];
            switch(adminAction) {
                case 'prevQuiz':
                    if (pageNum == 1) {
                        wss.broadcast('adminError::noPrevPage');
                    } else {
                        seq = 0;
                        userList.clear();
                        answerInfo = [];
                        --pageNum;
                        wss.broadcast('page');
                    }
                break;
                case 'nextQuiz':
                    console.log(`currentPage is ${pageNum}`)
                    if (pageNum == 10) {
                        wss.broadcast('adminError::noNextPage');
                    } else {
                        seq = 0;
                        userList.clear();
                        answerInfo = [];
                        ++pageNum;
                        wss.broadcast(`page`)                
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
                case 'sessionClear':
                    seq = 0;
                    userList.clear();
                    answerInfo = [];
                    wss.broadcast('sessionClear');
                    break;
                    
            }
        } else if (cmdType === 'answer') {
            const user = msgArr[1];
            const answer = msgArr[2];
            // console.log(`answer clicked ${answer} from ${user}`)
            // console.log(`user :${user}`);
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
    wss.broadcast(`result::${answerArr[pageNum - 1]}::${answer1}人[${resultArr[0]}%],${answer2}人[${resultArr[1]}%],${answer3}人[${resultArr[2]}%],${answer4}人[${resultArr[3]}%]`)

}

const roundingOff = (num) => parseFloat(num / answerList.length * 100).toFixed(2);


http.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})