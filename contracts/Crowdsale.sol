// SPDX-License-Identifier: WTFPL

pragma solidity ^0.8.0;

import "./Token.sol";
import "./Whitelist.sol";

contract Crowdsale {
    address public owner;
    Token public token;
    Whitelist public whitelist; // Whitelist contract instance
    uint256 public price;
    uint256 public maxTokens;
    uint256 public tokensSold;
    uint256 public minimumPurchase;
    uint256 public maximumPurchase;
    uint256 public startDate;

    event Buy(uint256 amount, address buyer);
    event Finalize(uint256 tokensSold, uint256 ethRaised);

    constructor(
        Token _token,
        Whitelist _whitelist, // Add Whitelist as a constructor parameter
        uint256 _price,
        uint256 _maxTokens,
        uint256 _minimumPurchase,
        uint256 _maximumPurchase,
        uint256 _startDate
        
    ) {
        owner = msg.sender;
        token = _token;
        whitelist = _whitelist; // Initialize the Whitelist contract
        price = _price;
        maxTokens = _maxTokens;
        minimumPurchase = _minimumPurchase;
        maximumPurchase = _maximumPurchase;
        startDate = _startDate;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    receive() external payable {}

    function buyTokens(uint256 _amount, address _buyer) public payable {
        require( _amount >= minimumPurchase, "Crowdsale: Amount is less than minimum purchase");
        require( _amount <= maximumPurchase, "Crowdsale: Amount is more than maximum purchase");
        require(block.timestamp >= startDate, "Crowdsale: Sale has not started yet");
        require(whitelist.isWhitelisted(_buyer), "Crowdsale: Buyer is not whitelisted"); // Whitelist check
        require(msg.value == (_amount / 1e18) * price, "Crowdsale: Incorrect ETH amount");
        require(token.balanceOf(address(this)) >= _amount, "Crowdsale: Not enough tokens");
        require(token.transfer(_buyer, _amount), "Crowdsale: Token transfer failed");

        tokensSold += _amount;

        emit Buy(_amount, _buyer);
    }

    function setPrice(uint256 _price) public onlyOwner {
        price = _price;
    }

    function setWhitelist(Whitelist _whitelist) public onlyOwner {
        whitelist = _whitelist; // Allow updating the Whitelist contract
    }

function finalize() public onlyOwner {
    uint256 value = address(this).balance; // Capture contract ETH balance
    emit Finalize(tokensSold, value); // Emit before transferring ETH

    // Transfer remaining tokens to the owner
    require(token.transfer(owner, token.balanceOf(address(this))), "Crowdsale: Token transfer failed");

    // Transfer ETH balance to the owner
    (bool sent, ) = owner.call{value: value}("");
    require(sent, "Crowdsale: ETH transfer failed");
}


}
