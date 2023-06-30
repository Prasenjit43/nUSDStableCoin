// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

//import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./AggregatorV3Interface.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract PriceOracle {
    using SafeMath for uint256;

    AggregatorV3Interface private priceOracle;
    uint256 public unstableColPrice;
    address public datafeed;

    function setDataFeedAddress(address contractaddress) external {
        datafeed = contractaddress;
        priceOracle = AggregatorV3Interface(datafeed);
    }

    function colPriceToWei() external returns (uint256) {
        (, uint256 price, , , ) = priceOracle.latestRoundData();
        unstableColPrice = price.mul(1e10);
        return unstableColPrice;
    }
}
