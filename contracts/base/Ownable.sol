pragma solidity ^0.4.18;

contract Ownable {
  address public owner;

  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

  function Ownable() public {
    owner = msg.sender;
  }

  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  function transferOwnership(address newOwner) public onlyOwner {
    require(newOwner != address(0));
    emit OwnershipTransferred(owner, newOwner);
    owner = newOwner;
  }

  function withdraw(address to, uint256 amount) public onlyOwner {
    require(to != address(0));
    if (amount == 0) amount = address(this).balance;
    to.transfer(amount);
  }

  function kill() public onlyOwner {
    selfdestruct(owner);
  }
}
