const PrivateKeyProvider = require('truffle-privatekey-provider');

const Config = require('./server/config');

module.exports = {
  networks: {
    rinkeby: {
      provider: new PrivateKeyProvider(Config.walletPrivateKey, Config.nodeUrl),
      network_id: 4,
    },
    // dev: {
    //   host: "127.0.0.1",
    //   port: 8545,
    //   gas: 2000000,
    //   gasPrice: 31000000000,
    //   network_id: "*"
    // },
    // frontier: {
    //   provider: new PrivateKeyProvider(Config.walletPrivateKey, Config.nodeUrl),
    //   gas: 6000000,
    //   gasPrice: 31000000000,
    //   network_id: 1
    // }
  }
};
