# MiniTreasury Smart Contract

## Overview

This project was developed as part of the take-home assignment for Valory, aimed at creating a decentralized treasury contract to handle ERC20 and ERC721 token deposits and withdrawals.

## Features

- **ERC20 Deposits and Withdrawals**: Users can deposit and withdraw ERC20 tokens.
- **ERC721 Deposits and Withdrawals**: Users can deposit and withdraw specific ERC721 tokens.
- **Token Enablement**: The owner can enable or disable specific tokens for deposits and withdrawals.

## Structure

- `contracts/`: Contains the Solidity smart contracts, including `MiniTreasury.sol`.
- `test/`: Contains test scripts for verifying the functionality of the smart contracts using Hardhat.

## Commands

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js