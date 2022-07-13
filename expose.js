const ngrok = require('ngrok');

const expose = async() => {
    const url = await ngrok.connect({authtoken: '2AY1VI0gdV40uNx4ux6wEzqHdhV_7hdpTYm4qLBattoJ5wadB', addr: 8301});
    console.log('Ngrok Tunner URL: ', url);
}

expose();