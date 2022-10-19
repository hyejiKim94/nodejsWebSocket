ws.onmessage = (data) => {
    console.log('ws has message');
    const dataArr = String(data.data).split('::');
    const cmdType = dataArr[0];
    if (cmdType === 'page') {
        location.href='/page';
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