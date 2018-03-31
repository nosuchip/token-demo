const AsiaTokenModel = function(config) {
  const self = this;

  self.pollTimeout = 5000;
  self.contractAddress = config.contractAddress;
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
  self.currentPage = ko.observable();
  self.isDone = ko.observable(false);

  self.isAddressValid = ko.computed(function() {
    return self.address() && /^(0x){0,1}[0-9a-fA-F]{40}$/i.test(self.address());
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

  function updateBalance() {
    if (!self.isAddressValid()) return;

    (function() {
      const url = 'https://api-rinkeby.etherscan.io/api';
      const params = {
        module: 'account',
        action: 'tokenbalance',
        contractaddress: self.contractAddress,
        address: self.address(),
        tag: 'latest',
      };

      $.getJSON(url, params, function(resp) {
        if (resp.status === '1' && resp.result) {
          const tokens = new BigNumber(resp.result).div(10**self.tokenDecimals).toNumber();
          self.balanceTokens(tokens);
        };
      });
    })();

    (function() {
      const url = 'https://api-rinkeby.etherscan.io/api';
      const params = {
        module: 'account',
        action: 'balance',
        address: self.address(),
        tag: 'latest',
      };

      $.getJSON(url, params, function(resp) {
        if (resp.status === '1' && resp.result) {
          var eth = new BigNumber(web3.fromWei(resp.result)).toFixed(3);
          self.balanceEth(eth);
        }
      });
    })();


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
    url = 'http://api-rinkeby.etherscan.io/api';
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
      if (currentTimestamp - txTimestamp <= 2 * self.pollTimeout) {
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
    self.address.subscribe(updateBalance);
    self.isDone.subscribe(updateBalance);
    self.amountTokens.subscribe(estimateEthersAmount);
    self.currentPage.subscribe(pageChanged);
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
