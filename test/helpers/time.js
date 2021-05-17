const Web3 = require('web3');
const web3 = new Web3();

async function increase(duration) {

    //first, let's increase time
    await web3.currentProvider.sendAsync({
        jsonrpc: "2.0",
        method: "evm_increaseTime",
        params: [duration], // there are 86400 seconds in a day
        id: new Date().getTime()
    }, () => {});

    //next, let's mine a new block
    web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_mine',
        params: [],
        id: new Date().getTime()
    })

}

const duration = {

    seconds: function (val) {
        return val;
    },
    minutes: function (val) {
        return val * this.seconds(60);
    },
    hours: function (val) {
        return val * this.minutes(60);
    },
    days: function (val) {
        return val * this.hours(24);
    },
}

module.exports = {
    increase,
    duration,
};


// const jsonrpc = '2.0'
// const id = 0
// const send = (method, params = []) =>
//   web3.currentProvider.send({ id, jsonrpc, method, params })
// const timeTravel = async seconds => {
//   await send('evm_increaseTime', [seconds])
//   await send('evm_mine')
// }
// module.exports = timeTravel
