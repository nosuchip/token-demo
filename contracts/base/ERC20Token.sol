pragma solidity ^0.4.18;

contract ERC20Token {
  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);

  function totalSupply() public view returns (uint256);
  function balanceOf(address who) public view returns (uint256);
  function transfer(address to, uint256 value) public returns (bool);
  function transferFrom(address from, address to, uint256 value) public returns (bool);
  function allowance(address owner, address spender) public view returns (uint256);
  function approve(address spender, uint256 value) public returns (bool);
}
