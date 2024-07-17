// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./Interfaces/IERC20.sol";
import {IERC721} from "./Interfaces/IERC721.sol";
import {ERC721TokenReceiver} from "../lib/solmate/src/tokens/ERC721.sol";

contract MiniTreasury is ERC721TokenReceiver {
    address public owner;

    mapping(address token => bool) public enabledTokens;

    mapping(address sender => 
        mapping(address token => uint256)) public erc20Deposits;

    mapping(address sender => 
        mapping(address token => 
            mapping(uint256 tokenId => bool))) public erc721Deposits;

    event DepositERC20(address indexed sender, address indexed token, uint256 amount);
    event DepositERC721(address indexed sender, address indexed token, uint256 tokenId);
    event WithdrawalERC20(address indexed recipient, address indexed token, uint256 amount);
    event WithdrawalERC721(address indexed recipient, address indexed token, uint256 tokenId);
    event TokenEnabled(address indexed token, bool enabled);

    // -------------------------------

    constructor() {
        owner = msg.sender;
    }

    // -------------------------------

    function setTokenStatus(address token, bool enabled) external {
        require(msg.sender == owner, "Not the owner");

        enabledTokens[token] = enabled;

        emit TokenEnabled(token, enabled);
    }

    // -------------------------------

    function depositERC20(address token, uint256 amount) external {
        require(enabledTokens[token], "Token not enabled");

        erc20Deposits[msg.sender][token] += amount;

        emit DepositERC20(msg.sender, token, amount);

        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20(token).transferFrom.selector, msg.sender, address(this), amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
    }

    function withdrawERC20(address token, uint256 amount) external {
        require(enabledTokens[token], "Token not enabled");
        require(erc20Deposits[msg.sender][token] >= amount, "Insufficient balance");

        erc20Deposits[msg.sender][token] -= amount;

        emit WithdrawalERC20(msg.sender, token, amount);

        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20(token).transfer.selector, msg.sender, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
    }

    // -------------------------------

    function depositERC721(address token, uint256 tokenId) external {
        require(enabledTokens[token], "Token not enabled");

        erc721Deposits[msg.sender][token][tokenId] = true;
        
        emit DepositERC721(msg.sender, token, tokenId);

        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC721(token).transferFrom.selector, msg.sender, address(this), tokenId)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
    }

    function withdrawERC721(address token, uint256 tokenId) external {
        require(enabledTokens[token], "Token not enabled");
        require(erc721Deposits[msg.sender][token][tokenId] == true, "Incorrect token ID");

        delete erc721Deposits[msg.sender][token][tokenId];

        emit WithdrawalERC721(msg.sender, token, tokenId);

        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC721(token).safeTransferFrom.selector, address(this), msg.sender, tokenId)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
    }
}