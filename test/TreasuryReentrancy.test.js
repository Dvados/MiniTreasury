const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("TreasuryReentrancy", function() {
    const decimals = 18;

    async function deploy() {
        const [owner, user] = await ethers.getSigners();

        // Deploy MiniTreasury
        const MiniTreasury = await ethers.getContractFactory("MiniTreasury", owner);
        const treasury = await MiniTreasury.deploy();
        await treasury.waitForDeployment();

        // Deploy ERC20 token
        const ERC20 = await ethers.getContractFactory("TestToken", owner);
        const tokenERC20 = await ERC20.deploy("Test Token", "TT", decimals);
        await tokenERC20.waitForDeployment();

        // Deploy Attacker
        const AttackerContract = await ethers.getContractFactory("Attacker", owner);
        const attacker = await AttackerContract.deploy(treasury.target, tokenERC20.target);
        await attacker.waitForDeployment();

        return { user, treasury, tokenERC20, attacker };
    }


    it("Should prevent reentrancy attacks", async function() {
        const { user, treasury, tokenERC20, attacker } = await loadFixture(deploy);

        await tokenERC20.mint(user.address, ethers.parseUnits("100", decimals));
        await tokenERC20.connect(user).approve(treasury.target, ethers.parseUnits("100", decimals));
        await treasury.connect(user).depositERC20(tokenERC20.target, ethers.parseUnits("100", decimals));

        await tokenERC20.mint(attacker.target, ethers.parseUnits("100", decimals));
        await attacker.deposit(ethers.parseUnits("100", decimals));

        await treasury.enableToken(tokenERC20.target, true);

        await expect(
            attacker.attack(ethers.parseUnits("100", decimals))
        ).to.be.revertedWith("Insufficient balance");
    });
});