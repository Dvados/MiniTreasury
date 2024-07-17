# Internal audit of autonolas-tokenomics
The review has been performed based on the contract code in the following repository:<br>
`https://github.com/Dvados/MiniTreasury` <br>
commit: `5875f1bc46f4177acf11131cc3fdbf6f07fe5ef8` <br> 

## Objectives
The audit focused on MiniTreasury.

## ISSUE
### Medium: Unsymmetrical behavior leading to token locking.
```
depositERC20() for disabled token -> OK
after try withdrawERC20() -> revert
```
### Medium: depositERC20
```
    function depositERC20(address token, uint256 amount) external {
        require(ERC20(token).transferFrom(msg.sender, address(this), amount), "Transfer failed");

        erc20Deposits[msg.sender][token] += amount;

        emit DepositERC20(msg.sender, token, amount);
1. require(ERC20(token).transferFrom(msg.sender, address(this), amount), "Transfer failed"); not worked for early/non-full-ERC20, like well know USDT
https://github.com/d-xo/weird-erc20?tab=readme-ov-file#missing-return-values <br>
2. non CEI: https://detectors.auditbase.com/checks-effects-interactions
Reentrancy issue for malicious ERC20 implementation. It is not critical (for deposit), but it is better to avoid it.
```

### Low: depositERC721
```
function depositERC721(address token, uint256 tokenId) external {
        ERC721(token).transferFrom(msg.sender, address(this), tokenId);

        erc721Deposits[msg.sender][token][tokenId] = true;
        
        emit DepositERC721(msg.sender, token, tokenId);
    }
1. non CEI: https://detectors.auditbase.com/checks-effects-interactions
Reentrancy issue for malicious ERC721 implementation. It is not critical (for deposit), but it is better to avoid it.
```

### Low/Notes enableToken
```
function enableToken(address token, bool enabled) external {
        require(msg.sender == owner, "Not the owner");

        enabledTokens[token] = enabled;
In reality, this function changes the status. 
Because bool enabled can be false or true.
That is, the name and description do not fully correspond to the behavior.
```

