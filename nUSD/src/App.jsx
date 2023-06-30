import React, { useEffect, useState } from "react";
import Web3 from "web3";
import './App.css'
import priceOracleArtifact from "../../build/contracts/PriceOracle.json";
import nUSDGovernanceArtifact from "../../build/contracts/nUSDGovernance.json";
import nUSDCoinArtifact from "../../build/contracts/nUSDStableCoin.json";
import BN from "bn.js";

function App() {
  const [account, setAccount] = useState("");
  const [state, setState] = useState({
    web3: null,
     priceOracleContract: null,
     nUSDGovernanceContract: null,
     nUSDCoinContract: null,
  });

  const [etherVal, setEther] = useState('');
  const [totalSupply, setTotalSupply] = useState('');
  const [accountTokenBal, setAccountTokenBal] = useState('');
  const [contractBal, setContractBal] = useState('');
  const [triggerRefresh, setTriggerRefresh] = useState(false);

  const PRICE_ORACLE_ADDR = "0x0cA7A4166bE661F1ECe8432036A5D139aaB79E3F";
  const nUSD_GOVERNANCE_ADDR = "0xc7422F777202e7a1fa93172dad5cB5f8Ef227F02";
  const nUSD_COIN_ADDR = "0x7049388De3e8947975732408974C4C390bD18291";


  useEffect(() => {
    const connectWallet = async () => {
      console.log("Inside connect wallet");
      try {
        const { ethereum } = window;
        if (ethereum) {
          const web3 = new Web3(window.ethereum);
          await ethereum.request({
            method: "eth_requestAccounts",
          });
          const account = await web3.eth.getAccounts();
          window.ethereum.on("chainChanged", () => {
            window.location.reload();
          });
          window.ethereum.on("accountsChanged", () => {
            window.location.reload();
          });
          const _priceOracleContract = new web3.eth.Contract(
            priceOracleArtifact.abi,
            PRICE_ORACLE_ADDR
          );
          const _nUSDGovernanceContract = new web3.eth.Contract(
            nUSDGovernanceArtifact.abi,
            nUSD_GOVERNANCE_ADDR
          );
          const _nUSDCoinContract = new web3.eth.Contract(
            nUSDCoinArtifact.abi,
            nUSD_COIN_ADDR
          );

          setAccount(account);
          setState({
            web3: web3,
             priceOracleContract: _priceOracleContract,
             nUSDGovernanceContract: _nUSDGovernanceContract,
             nUSDCoinContract : _nUSDCoinContract
          });
        } else {
          alert("Please install metamask");
        }
      } catch (error) {
        console.log(error);
      }
    };
    connectWallet();
  }, []);

  useEffect(() => {
    const calculate = async () => {
      if (state.nUSDCoinContract) {
        const totalSupply = await state.nUSDCoinContract.methods.totalSupply().call();
        console.log("totalSupply :", totalSupply);
        const totalSupplyInEther = state.web3.utils.fromWei(totalSupply, 'ether');
        console.log("totalSupply in ether :", totalSupplyInEther);
        setTotalSupply(totalSupplyInEther);

        const accountTokenBal = await state.nUSDCoinContract.methods.balanceOf(account[0]).call();
        console.log("accountBal :", accountTokenBal);
        const accountTokenBalInEther = state.web3.utils.fromWei(accountTokenBal, 'ether');
        console.log("accountBal in ether :", accountTokenBalInEther);
        setAccountTokenBal(accountTokenBalInEther);

        const contractBalance = await state.web3.eth.getBalance(nUSD_GOVERNANCE_ADDR);
        const contractBalanceInEther = state.web3.utils.fromWei(contractBalance, 'ether');
        console.log("contractBalance in ether :", contractBalanceInEther);
        setContractBal(contractBalanceInEther);
      }
    };

   calculate();
}, [state.nUSDCoinContract,triggerRefresh]);


  const resetStates = () =>{
    setEther('');
    setTriggerRefresh(!triggerRefresh);
  }

  const handleEtherInputChange = (event) => {
    event.preventDefault();
    console.log("ether : ", event.target.value);
    setEther(event.target.value);
  };

  const approveToken = async(_spender, _amount) => {
    return new Promise((resolve, reject) => {
    try {
       state.nUSDCoinContract.methods
      .approve(_spender,_amount)
        .send({ from: account[0]})
        .on("transactionHash", function (hash) {
          alert("Approved successfully.\nTransaction Hash: : " + hash);
        })
        .on("confirmation", function (confirmationNumber, receipt) {
          console.log("confirmationNumber:", confirmationNumber);
          resolve();
        })
        .on("receipt", function (receipt) {
          console.log("Receipt:", receipt);
          alert(" Wait for transaction to complete ...");
        })
        .on("error", function (error, receipt) {
          console.log("Error:", error);
          console.log("Receipt:", receipt);
          reject();
        });
    } catch (error) {
      alert("Unexpected Error while approving");
      console.log("Unexpected Error while approving");
      console.log(error);
      reject(error.message);
    }  
  });
}

  const fetchTokenForEtherExchange =(_priceInWei) =>{
    return new Promise((resolve, reject) => {
      try {
       state.nUSDGovernanceContract.methods
        .getTokenToSubmit(state.web3.utils.toWei(etherVal, 'ether'), _priceInWei)
        .call({ from: account[0] })
        .then(function (result) {
          resolve(result);
        });
        } catch (error) {
          console.log(error);
          reject(error.message);
        }
  });
}

const getUSDPrice =() =>{
  return new Promise((resolve, reject) => {
    try {
     state.priceOracleContract.methods
      .colPriceToWei()
      .call({ from: account[0] })
      .then(function (result) {
        resolve(result);
      });
      } catch (error) {
        console.log(error);
        reject(error.message);
      }
});
}


  const fetchEtherForTokens = (_accountTokenBal, _priceInWei) => {
    return new Promise((resolve, reject) => {
      try {
        state.nUSDGovernanceContract.methods
          .getEtherForTokens(state.web3.utils.toWei(_accountTokenBal, 'ether'), _priceInWei)
          .call({ from: account[0] })
          .then(function (result) {
          alert("You have less no of tokens, you can only redeem " + state.web3.utils.fromWei(result, 'ether') + ' ethers');
          resolve(result);
        });
        } catch (error) {
          console.log(error);
          reject(error.message);
        }      
    });
  }

  const redeemTokens = () => {
    return new Promise((resolve, reject) => {
      try {
        state.nUSDGovernanceContract.methods
          .redeem(state.web3.utils.toWei(etherVal, 'ether'))
          .send({ from: account[0] })
          .on("transactionHash", function (hash) { })
          .on("confirmation", function (confirmationNumber, receipt) {
            console.log("confirmationNumber:", confirmationNumber);
            resetStates();
            resolve();
          })
          .on("receipt", function (receipt) {
            console.log("Receipt:", receipt);
            resetStates();
            alert("Ether redeemed successfully.\nTransaction Hash: : " + receipt.transactionHash);
          })
          .on("error", function (error, receipt) {
            console.log("Error:", error);
            console.log("Receipt:", receipt);
            reject();
          });
      } catch (error) {
        alert("Unexpected Error while redeeming ether");
        console.log("Unexpected Error while redeeming ether");
        console.log(error);
        reject(error.message);
      }
    });
  }



  const handleDepositClick = async(event) => {
    event.preventDefault();
          try {
            await state.nUSDGovernanceContract.methods
            .deposit()
              .send({ from: account[0] ,
                value : state.web3.utils.toWei(etherVal, 'ether')})
              .on("transactionHash", function (hash) {})
              .on("confirmation", function (confirmationNumber, receipt) {
                console.log("confirmationNumber:", confirmationNumber);
                resetStates();
              })
              .on("receipt", function (receipt) {
                console.log("Receipt:", receipt);
                resetStates();
                alert("Ether deposit successfully.\nTransaction Hash: : " + receipt.transactionHash);
              })
              .on("error", function (error, receipt) {
                console.log("Error:", error);
                console.log("Receipt:", receipt);
              });
          } catch (error) {
            alert("Unexpected Error while depositing ether");
            console.log("Unexpected Error while depositing ether");
            console.log(error);
          }          
  };

  const handleRedeemClick = async(event) => {
    event.preventDefault();
    const priceInWei = await getUSDPrice();
    const _tokensForEther = await fetchTokenForEtherExchange(priceInWei);

    const bn_tokensForEther = new BN(_tokensForEther);
    const bn_accountTokenBal = new BN(state.web3.utils.toWei(accountTokenBal, 'ether'));
    if (bn_tokensForEther.gt(bn_accountTokenBal)) {
      await fetchEtherForTokens(accountTokenBal, priceInWei);
        resetStates();
    }else{
        await approveToken(nUSD_GOVERNANCE_ADDR,state.web3.utils.toWei(accountTokenBal, 'ether'));
        await redeemTokens();
    }
  };


  return (
    <>
      <div>
         <label>Address : {account ? account[0]: "Not Connected" }</label>
         <br></br>
         <br></br>
        <label>Enter Ether : </label>
      <input type="text" value={etherVal} onChange={handleEtherInputChange} />
      <br></br>
      <br></br>
      <button onClick={handleDepositClick}>Deposit</button>
      &nbsp;
      <button onClick={handleRedeemClick}>Redeem</button>
      <br></br>
      <br></br>
      <label>Contract Balance (Ether): </label>
      <input
        type="text"
        value={contractBal}
        readOnly        
      />
      <br></br>
      <br></br>
      <label>Total Supply of Token (nUSD): </label>
      <input
        type="text"
        value={totalSupply}
        readOnly        
      />
      <br></br>
      <br></br>
      <label>Account Token (nUSD) Balance: </label>
      <input
        type="text"
        value={accountTokenBal}
        readOnly
        
      />
    </div>
    </>
  )
}

export default App
