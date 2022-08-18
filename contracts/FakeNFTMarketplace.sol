// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";

contract FakeNFTMarketplace {
    mapping(uint => address) public tokens;

    uint nftPrice = 0.05 ether;

    function purchase(uint _tokenId) external payable {
        require(msg.value == nftPrice, "this NFT costs 0.1 ether");
        tokens[_tokenId] = msg.sender;
    }

    function getPrice() external view returns (uint) {
        return nftPrice;
    }

    function availabe(uint _tokenId) external view returns (bool) {
        if (tokens[_tokenId] == address(0)) {
            return true;
        }
        return false;
    }
}
