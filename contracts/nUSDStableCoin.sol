// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract nUSDStableCoin is ERC20Burnable {
    address public governanceContract;

    modifier onlyGovernanceContract() {
        require(
            msg.sender == governanceContract,
            "You are not authorized to mint"
        );
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _governanceContract
    ) ERC20(_name, _symbol) {
        governanceContract = _governanceContract;
    }

    function minting(
        address _account,
        uint256 _amount
    ) external onlyGovernanceContract {
        _mint(_account, _amount);
    }

    function burnToken(uint _amount) external onlyGovernanceContract {
        burn(_amount);
    }
}
