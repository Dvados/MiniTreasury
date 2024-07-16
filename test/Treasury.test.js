const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Treasury", function() {
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

        // Deploy ERC721 token
        const ERC721 = await ethers.getContractFactory("TestNFT", owner);
        const tokenERC721 = await ERC721.deploy("Test NFT", "TNFT");
        await tokenERC721.waitForDeployment();

        return { user, treasury, tokenERC20, tokenERC721 };
    }


    it('Deploys a Contract', async function() {
        const { treasury, tokenERC20, tokenERC721 } = await loadFixture(deploy);

        expect(treasury.target).to.be.properAddress;
        expect(tokenERC20.target).to.be.properAddress;
        expect(tokenERC721.target).to.be.properAddress;
    });


    describe("Token Enablement", function() {
        it("Owner can enable and disable tokens", async function() {
            const { treasury, tokenERC20, tokenERC721 } = await loadFixture(deploy);
    
            await treasury.enableToken(tokenERC20.target, true);
            const isEnabledTokenERC20 = await treasury.enabledTokens(tokenERC20.target);
            expect(isEnabledTokenERC20).to.be.true;
    
            await treasury.enableToken(tokenERC20.target, false);
            const isDisabledTokenERC20 = await treasury.enabledTokens(tokenERC20.target);
            expect(isDisabledTokenERC20).to.be.false;
    
            const isDisabledTokenERC721 = await treasury.enabledTokens(tokenERC721.target);
            expect(isDisabledTokenERC721).to.be.false;
        });
    

        it("Non-owner cannot enable or disable tokens", async function() {
            const { user, treasury, tokenERC20 } = await loadFixture(deploy);
    
            await expect(
                treasury.connect(user).enableToken(tokenERC20.target, true)
            ).to.be.revertedWith("Not the owner");
        });
    });    


    it("Deposit ERC20", async function() {
        const { user, treasury, tokenERC20 } = await loadFixture(deploy);

        await tokenERC20.mint(user.address, ethers.parseUnits("100", decimals));
        await tokenERC20.connect(user).approve(treasury.target, ethers.parseUnits("100", decimals));

        await treasury.connect(user).depositERC20(tokenERC20.target, ethers.parseUnits("50", decimals));

        const erc20Deposits = await treasury.erc20Deposits(user.address, tokenERC20.target)

        expect(erc20Deposits).to.eq(ethers.parseUnits("50", decimals));
    });


    describe("ERC20 Withdrawals", function() {
        it("Should revert when attempting to withdraw ERC20 when token is not enabled", async function() {
            const { user, treasury, tokenERC20 } = await loadFixture(deploy);

            await tokenERC20.mint(user.address, ethers.parseUnits("100", decimals));
            await tokenERC20.connect(user).approve(treasury.target, ethers.parseUnits("100", decimals));
            
            await treasury.connect(user).depositERC20(tokenERC20.target, ethers.parseUnits("50", decimals));

            await expect(
                treasury.connect(user).withdrawERC20(tokenERC20.target, ethers.parseUnits("20", decimals))
            ).to.be.revertedWith("Token not enabled");
        });


        it("Should revert when attempting to withdraw more than deposited amount for enabled token", async function() {
            const { user, treasury, tokenERC20 } = await loadFixture(deploy);

            await tokenERC20.mint(user.address, ethers.parseUnits("100", decimals));
            await tokenERC20.connect(user).approve(treasury.target, ethers.parseUnits("100", decimals));
            
            await treasury.connect(user).depositERC20(tokenERC20.target, ethers.parseUnits("50", decimals));
            await treasury.enableToken(tokenERC20.target, true);

            await expect(
                treasury.connect(user).withdrawERC20(tokenERC20.target, ethers.parseUnits("70", decimals))
            ).to.be.revertedWith("Insufficient balance");
        });


        it("Should withdraw correct amount of ERC20 when token is enabled", async function() {
            const { user, treasury, tokenERC20 } = await loadFixture(deploy);

            await tokenERC20.mint(user.address, ethers.parseUnits("100", decimals));
            await tokenERC20.connect(user).approve(treasury.target, ethers.parseUnits("100", decimals));
            
            await treasury.connect(user).depositERC20(tokenERC20.target, ethers.parseUnits("50", decimals));
            await treasury.enableToken(tokenERC20.target, true);

            await treasury.connect(user).withdrawERC20(tokenERC20.target, ethers.parseUnits("20", decimals));

            const erc20Deposits = await treasury.erc20Deposits(user.address, tokenERC20.target);

            expect(erc20Deposits).to.eq(ethers.parseUnits("30", decimals));
        });
    });


    it("Deposit ERC721", async function() {
        const { user, treasury, tokenERC721 } = await loadFixture(deploy);

        await tokenERC721.safeMint(user.address);
        await tokenERC721.connect(user).approve(treasury.target, 1);

        await treasury.connect(user).depositERC721(tokenERC721.target, 1);

        const erc721Deposits = await treasury.erc721Deposits(user.address, tokenERC721.target)

        expect(erc721Deposits).to.eq(1);
    });


    describe("ERC721 Withdrawals", function() {
        it("Should revert when attempting to withdraw ERC721 when token is not enabled", async function() {
            const { user, treasury, tokenERC721 } = await loadFixture(deploy);

            await tokenERC721.safeMint(user.address);
            await tokenERC721.connect(user).approve(treasury.target, 1);
    
            await treasury.connect(user).depositERC721(tokenERC721.target, 1);

            await expect(
                treasury.connect(user).withdrawERC721(tokenERC721.target, 1)
            ).to.be.revertedWith("Token not enabled");
        });


        it("Should revert when attempting to withdraw token with incorrect tokenId when token is enabled", async function() {
            const { user, treasury, tokenERC721 } = await loadFixture(deploy);

            await tokenERC721.safeMint(user.address);
            await tokenERC721.connect(user).approve(treasury.target, 1);
    
            await treasury.connect(user).depositERC721(tokenERC721.target, 1);
            await treasury.enableToken(tokenERC721.target, true);

            await expect(
                treasury.connect(user).withdrawERC721(tokenERC721.target, 4)
            ).to.be.revertedWith("Incorrect token ID");
        });


        it("Should withdraw ERC721 when token is enabled", async function() {
            const { user, treasury, tokenERC721 } = await loadFixture(deploy);

            await tokenERC721.safeMint(user.address);
            await tokenERC721.connect(user).approve(treasury.target, 1);
    
            await treasury.connect(user).depositERC721(tokenERC721.target, 1);
            await treasury.enableToken(tokenERC721.target, true);

            await treasury.connect(user).withdrawERC721(tokenERC721.target, 1);

            const erc721Deposits = await treasury.erc721Deposits(user.address, tokenERC721.target);

            expect(erc721Deposits).to.eq(0);
        });
    });
});