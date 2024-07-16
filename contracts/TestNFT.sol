// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "../lib/solmate/src/tokens/ERC721.sol";
import {Strings} from "./utils/Strings.sol";

contract TestNFT is ERC721 {
    using Strings for uint256;
    
    uint256 private _nextTokenId;

    constructor(string memory _name, string memory _symbol)
        ERC721(name, symbol) 
    {}

    function _baseURI() internal pure returns (string memory) {
        return "https://api.example.com/metadata/";
    }

    function tokenURI(uint256 tokenId) public view virtual override returns(string memory) {
        require(_ownerOf[tokenId] != address(0), "Token not minted!");

        string memory baseURI = _baseURI();

        return bytes(baseURI).length > 0 ?
            string(abi.encodePacked(baseURI, tokenId.toString())) :
            "";
    }

    function safeMint(address to) external {
        _safeMint(to, ++_nextTokenId);
    }

    function burn(uint256 tokenId) external {
        _burn(tokenId);
    }
}