// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./nUSDStableCoin.sol";

interface IPriceOracle {
    function setDataFeedAddress(address contractaddress) external;
    function colPriceToWei() external returns (uint256);
}

contract nUSDGovernance is ReentrancyGuard {
    using SafeMath for uint256;
    IPriceOracle public priceOracle;
    nUSDStableCoin public _nUSD;

    /*Mapping to check denial of service attack
    assuming if user try to deposit and withdraw 
    small ether < then .5 ether , it will store the 
    count in mapping
    */
    mapping(address => uint) public deposit_reputation;
    mapping(address => uint) public redeem_reputation;

    constructor(address _aggregatorV3InterfaceAddress, address _priceOracle) {
        _nUSD = new nUSDStableCoin("nUSDStable Coin", "nUSD", address(this));
        priceOracle = IPriceOracle(_priceOracle);
        priceOracle.setDataFeedAddress(_aggregatorV3InterfaceAddress);
    }

    function deposit() external payable nonReentrant {
        require(
            msg.value >= 1 ether ||
                (msg.value > 0 && deposit_reputation[msg.sender] <= 100),
            "You are not allowed to deposit"
        );
        uint priceInWei = priceOracle.colPriceToWei();
        uint256 tempv1 = priceInWei.mul(msg.value);
        uint256 noOftokenToMint = tempv1.div(2 ether);
        _nUSD.minting(msg.sender, noOftokenToMint);
        if (msg.value < 1 ether) {
            deposit_reputation[msg.sender]++;
        }
    }

    function redeem(uint _valueInWei) external nonReentrant {
        require(_valueInWei > 0, "Should be greater than 0");
        require(
            _valueInWei >= (1 ether / 2) ||
                (_valueInWei > 0 && redeem_reputation[msg.sender] <= 100),
            "You are not allowed to withdraw"
        );
        uint priceInWei = priceOracle.colPriceToWei();
        uint requiredTokens = getTokenToSubmit(_valueInWei, priceInWei);
        require(
            _nUSD.balanceOf(msg.sender) >= requiredTokens,
            "Insuffcient coins"
        );
        uint weiToTransfer = _valueInWei;
        payable(msg.sender).transfer(weiToTransfer);
        _nUSD.transferFrom(msg.sender, address(this), requiredTokens);
        _nUSD.burnToken(requiredTokens);
        if (_valueInWei < (0.5 ether)) {
            redeem_reputation[msg.sender]++;
        }
    }

    function getTokenToSubmit(
        uint _valueInWei,
        uint _priceInWei
    ) public pure returns (uint) {
        uint256 tempv1 = ((_priceInWei.mul(_valueInWei)).mul(2)).div(1 ether);
        return tempv1;
    }

    function getEtherForTokens(
        uint _tokenInWei,
        uint _priceInWei
    ) public pure returns (uint) {
        uint256 tempv1 = (_tokenInWei.mul(0.5 ether)).div(_priceInWei);
        return tempv1;
    }
}
