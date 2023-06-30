const PriceOracle = artifacts.require("PriceOracle");
const nUSDGovernance = artifacts.require("nUSDGovernance");

module.exports = async (deployer) => {
  await deployer.deploy(PriceOracle);
  const priceOracleInstance = await PriceOracle.deployed();
  await deployer.deploy(nUSDGovernance,'0x694AA1769357215DE4FAC081bf1f309aDC325306',priceOracleInstance.address);
};
