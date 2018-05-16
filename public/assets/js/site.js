const AsiaTokenModel = function(config) {
  const self = this;

  self.pollTimeout = 5000;
  self.contractAddress = config.contractAddress;
  self.contractCreator = config.contractCreator;
  self.etherscanApiKey = "81R5Q6RAB81XTMFXCESI8FPS2BYEZ92RVG";
  self.tokenPrice = 0.1;  // ETH
  self.tokenDecimals = 8;  // ETH

  self.address = ko.observable();
  self.amountTokens = ko.observable();
  self.amountEthers = ko.observable();
  self.transaction = ko.observable();
  self.web3 = ko.observable();
  self.balanceEth = ko.observable();
  self.balanceTokens = ko.observable();
  self.currentPage = ko.observable(1);
  self.isDone = ko.observable(false);

  self.contractBalanceEth = ko.observable();
  self.contractBalanceTokens = ko.observable();


  self.isAddressValid = ko.computed(function() {
    return addressValidCheck(self.address());
  });

  self.isAmountValid = ko.computed(function() {
    return self.amountTokens() && !isNaN(self.amountTokens());
  });

  self.isPreorderValid = ko.computed(function() {
    return !!(
      self.amountTokens() &&
      self.isAmountValid() &&
      self.address() &&
      self.isAddressValid()
    );
  });

  self.addressLink = ko.computed(function() {
    if (!self.isAddressValid()) return null;

    return 'https://rinkeby.etherscan.io/address/' + self.address();
  });

  self.contractLink = ko.computed(function() {
    return 'https://rinkeby.etherscan.io/token/' + self.contractAddress;
  });

  self.addressQrCodeTag = ko.computed(function() {
    if (!self.isAddressValid()) return null;

    var typeNumber = 4;
    var errorCorrectionLevel = 'L';
    var qr = qrcode(typeNumber, errorCorrectionLevel);
    qr.addData(self.address());
    qr.make();

    return qr.createSvgTag();
  });

  self.authenticate = function() {
    alertify.prompt('Authenticate address').set({
      message: 'Please enter your ETH address below <small>(it doesn\'t makes it your own, we just show balance for it)</small>',
      onok: function(evt, value) { self.address(value); },
    });
  };

  self.nextStage = function(model, event) {
    var page = $(event.currentTarget).parents('.page'),
        nextPage = page.next();

    page.animate({left: '-100%'}, 500);
    nextPage.animate({left: '0'}, 500, function() {
      self.currentPage(nextPage.attr('data-page'));
    });
  }

  self.prevStage = function() {
    var page = $(event.currentTarget).parents('.page'),
    prevPage = page.prev();

    page.animate({left: '100%'}, 500);
    prevPage.animate({left: '0'}, 500, function() {
      self.currentPage(prevPage.attr('data-page'));
    });
  }

  function formatThousands(value) {
    return value.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
  };

  function addressValidCheck(address) {
    return address && /^(0x){0,1}[0-9a-fA-F]{40}$/i.test(address);
  }

  function updateBalance(address) {
    if (!address) address = self.address();

    if (!addressValidCheck(address)) return new Promise(function(accept, reject) { reject(address); });

    var promises = [];

    var p1 = new Promise(function(accept, reject) {
      const url = 'https://api-rinkeby.etherscan.io/api';
      const params = {
        module: 'account',
        action: 'tokenbalance',
        contractaddress: self.contractAddress,
        address: address,
        tag: 'latest',
      };

      $.getJSON(url, params, function(resp) {
        if (resp.status === '1' && resp.result) {
          const tokens = new BigNumber(resp.result).div(10**self.tokenDecimals).toNumber();
          accept(tokens);
        };
      });
    });

    var p2 = new Promise(function(accept, reject) {
      const url = 'https://api-rinkeby.etherscan.io/api';
      const params = {
        module: 'account',
        action: 'balance',
        address: address,
        tag: 'latest',
      };

      $.getJSON(url, params, function(resp) {
        if (resp.status === '1' && resp.result) {
          var eth = new BigNumber(web3.fromWei(resp.result)).toFixed(3);
          accept(eth);
        }
      });
    });

    return new Promise(function(accept, reject) {
      Promise.all([p1, p2]).then(function(values) {
        accept(values);
      });
    });
  }

  function estimateEthersAmount(value) {
    if (!self.isAmountValid()) {
      self.amountEthers('~~~');
      return;
    }

    var amount = new BigNumber(self.amountTokens()).mul(self.tokenPrice);

    self.amountEthers(amount.toString());
  };

  function pageChanged() {
    if (self.currentPage() === '2') {
      $('.progress-bar').hide().css('width', '0');
    } else if (self.currentPage() === '3') {
      setTimeout(function() { $('.progress-bar').show().css('width', '10%'); }, 500);

      checkTransactionStatus();
    }
  }

  function progress(percent) {
    $('.progress-bar').css('width', percent + '%');
  }

  function checkTransactionStatus() {
    url = 'https://api-rinkeby.etherscan.io/api';
    params = {
      module: 'account',
      action: 'txlist',
      address: self.contractAddress,
      sort: 'desc',
      startblock: '2027434',  // First contract transaction
    };

    var checkTransaction = function(tx) {
      const txTimestamp = parseFloat(tx.timeStamp) * 1000;
      const currentTimestamp = new Date().getTime();

      // Timestamps difference (in seconds) less then polling timeout * 2
      if (currentTimestamp - txTimestamp <= 12 * self.pollTimeout) {
        console.log('Transaction found!', tx);
        self.transaction(tx);

        // Let's imagune we can "verify" transaction
        progress(50);

        setTimeout(function() {
          progress(100);
          setTimeout(function() { self.isDone(true); }, 2000);
        }, 2000);

        return true;
      }

      return false;
    };

    var poll = function() {
      $.getJSON(url, params, function(resp) {
        if (resp && resp.result) {
          for(var i  = 0, tx; tx = resp.result[i]; i++) {
            if (tx.from && tx.from.toLowerCase() === self.address().toLowerCase()) {
              if (checkTransaction(tx)) return;
            }
          }
        }

        setTimeout(poll, self.pollTimeout);
      });
    };

    poll();
  }

  function checkWeb3() {
    if (typeof window.web3 !== "undefined" && typeof window.web3.currentProvider !== "undefined") {
      self.web3(new Web3(window.web3.currentProvider));
    } else {
      self.web3(new Web3());
    }
  }

  function bind() {
    var balanceUpdater = function() {
      updateBalance().then(function(values) {
        self.balanceTokens(formatThousands(values[0]));
        self.balanceEth(formatThousands(values[1]));
      }).catch(function(err) {
        console.log('Error');
      });
    }

    self.address.subscribe(balanceUpdater);
    self.isDone.subscribe(balanceUpdater);
    self.amountTokens.subscribe(estimateEthersAmount);
    self.currentPage.subscribe(pageChanged);

    updateBalance(self.contractAddress).then(function(values) {
      self.contractBalanceEth(formatThousands(values[1]));
    }).catch(function(err) {
      console.log('Error');
    });

    updateBalance(self.contractCreator).then(function(values) {
      self.contractBalanceTokens(formatThousands(values[0]));
    }).catch(function(err) {
      console.log('Error');
    });
  }

  function init() {
    ko.applyBindings(self, document.getElementById('root'));

    bind();

    checkWeb3();

    self.web3().eth.getCoinbase(function(err, res) {
      self.address(res);
    })
  }

  init();
};
