const Web3 = require('web3');
const CONFIG = require('../../hardhat.config.js');
const rpcUrl = CONFIG.networks.hardhat.forking.url;
const web3 = new Web3(rpcUrl);

async function increase(duration) {

    //first, let's increase time
    web3.currentProvider.send({
        jsonrpc: "2.0",
        method: "evm_increaseTime",
        params: [duration], // there are 86400 seconds in a day
        id: new Date().getTime()
    }, (err, foo) => {
      console.log(err, foo);
    });

    //next, let's mine a new block
    web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_mine',
        params: [],
        id: new Date().getTime()
    }, (err, foo) => {
      console.log(err, foo);
    });

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
