const AsiaTokenModel = function(config) {
  const self = this;

  self.address = ko.observable('0xa2156400a38a986728b52c769c00ad6975fe7b46');
  self.amountTokens = ko.observable('100');
  self.web3 = ko.observable();
  self.balanceEth = ko.observable();
  self.balanceTokens = ko.observable();

  self.isAddressValid = ko.computed(function() {
    return self.web3() && self.web3().isAddress(self.address());
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
    nextPage.animate({left: '0'}, 500);
  }

  self.prevStage = function() {
    var page = $(event.currentTarget).parents('.page'),
    prevPage = page.prev();

    page.animate({left: '100%'}, 500);
    prevPage.animate({left: '0'}, 500);
  }

  function checkWeb3() {
    if (typeof window.web3 !== "undefined" && typeof window.web3.currentProvider !== "undefined") {
      self.web3(new Web3(window.web3.currentProvider));
    } else {
      self.web3(new Web3());
    }
  }

  function bind() {
  }

  function init() {
    ko.applyBindings(self, document.getElementById('root'));

    bind();

    checkWeb3();
  }

  init();
};
