// SPDX-License-Identifier: WTFPL
pragma solidity ^0.8.0;

contract Whitelist {
    // Mapping to store whitelisted addresses
    mapping(address => bool) private whitelistedAddresses;

    // Address of the owner
    address public owner;

    // Events for logging changes
    event AddressAdded(address indexed account);
    event AddressRemoved(address indexed account);

    // Modifier to restrict access to the owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Whitelist: Only owner can call this function");
        _;
    }

    // Constructor to set the owner
    constructor() {
        owner = msg.sender;
    }

    // Function to add an address to the whitelist
    function addAddress(address _address) external onlyOwner {
        require(!whitelistedAddresses[_address], "Whitelist: Address is already whitelisted");
        whitelistedAddresses[_address] = true;
        emit AddressAdded(_address);
    }

    // Function to remove an address from the whitelist
    function removeAddress(address _address) external onlyOwner {
        require(whitelistedAddresses[_address], "Whitelist: Address is not whitelisted");
        whitelistedAddresses[_address] = false;
        emit AddressRemoved(_address);
    }

    // Function to check if an address is whitelisted
    function isWhitelisted(address _address) external view returns (bool) {
        return whitelistedAddresses[_address];
    }
}
