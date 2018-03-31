pragma solidity ^0.4.18;

import "./base/ERC20Token.sol";
import "./base/SafeMath.sol";
import "./base/Ownable.sol";


contract AsiaToken is ERC20Token, Ownable  {
  using SafeMath for uint256;

  event TokenPurchased(address indexed buyer, uint256 value, uint256 tokens);

  mapping(address => uint256) balances;
  mapping (address => mapping (address => uint256)) internal allowed;

  uint256 totalSupply_;

  uint256 public tokenPrice;    // In Wei per (1 token * 10^decimals)

  string public constant symbol = "ASIA";
  string public constant name = "AsiaToken";
  uint8 public constant decimals = 8;

  function AsiaToken() public {
    totalSupply_ = 1000000 * (uint256(10) ** decimals);
    balances[owner] = totalSupply_;
  }

  function() public payable {
    uint256 _tokensAmount = msg.value / tokenPrice;

    require(msg.sender != address(0));
    require(_tokensAmount <= balances[owner]);

    balances[owner] = balances[owner].sub(_tokensAmount);
    balances[msg.sender] = balances[msg.sender].add(_tokensAmount);
    emit Transfer(owner, msg.sender, _tokensAmount);
    emit TokenPurchased(msg.sender, msg.value, _tokensAmount);
  }

  function totalSupply() public constant returns (uint256) {
    return totalSupply_;
  }

  function balanceOf(address _owner) public constant returns (uint256 balance) {
    return balances[_owner];
  }

  function allowance(address _owner, address _spender) public constant returns (uint256) {
    return allowed[_owner][_spender];
  }

  function transfer(address _to, uint256 _amount) public returns (bool) {
    require(_to != address(0));
    require(_amount <= balances[msg.sender]);

    balances[msg.sender] = balances[msg.sender].sub(_amount);
    balances[_to] = balances[_to].add(_amount);
    emit Transfer(msg.sender, _to, _amount);
    return true;
  }

  function approve(address _spender, uint256 _amount) public returns (bool) {
    allowed[msg.sender][_spender] = _amount;
    emit Approval(msg.sender, _spender, _amount);
    return true;
  }

  function transferFrom(address _from, address _to, uint256 _amount) public returns (bool) {
    require(_to != address(0));
    require(_amount <= balances[_from]);
    require(_amount <= allowed[_from][msg.sender]);

    balances[_from] = balances[_from].sub(_amount);
    balances[_to] = balances[_to].add(_amount);
    allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_amount);
    emit Transfer(_from, _to, _amount);
    return true;
  }

  function increaseApproval(address _spender, uint _addedValue) public returns (bool) {
    allowed[msg.sender][_spender] = allowed[msg.sender][_spender].add(_addedValue);
    emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
    return true;
  }

  function decreaseApproval(address _spender, uint _subtractedValue) public returns (bool) {
    uint oldValue = allowed[msg.sender][_spender];
    if (_subtractedValue > oldValue) {
      allowed[msg.sender][_spender] = 0;
    } else {
      allowed[msg.sender][_spender] = oldValue.sub(_subtractedValue);
    }
    emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
    return true;
  }

  function setTokenPrice(uint256 _value) public onlyOwner {
    require(_value > 0);

    tokenPrice = _value;
  }
}
