var AsiaToken = artifacts.require("./AsiaToken.sol");

module.exports = function(deployer) {
  deployer.deploy(AsiaToken);
};
