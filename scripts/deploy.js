const { ethers } = require("hardhat");

const { CRYPTODEVS_NFT_CONTRACT_ADDRESS } = require("../constants");

async function main() {
  const gwei = 1000000000;
  const gas = 40000;
  const gasPrice = gwei * 20;
  // Deploy the FakeNFTMarketplace contract first
  const FakeNFTMarketplace = await ethers.getContractFactory("FakeNFTMarketplace");
  const fakeNftMarketplace = await FakeNFTMarketplace.deploy();
  await fakeNftMarketplace.deployed();

  console.log("FakeNFTMarketplace deployed to: ", fakeNftMarketplace.address);

  // Now deploy the CryptoDevsDAO contract
  const CryptoDevsDAO = await ethers.getContractFactory("CryptoDevsDAO");
  const cryptoDevsDAO = await CryptoDevsDAO.deploy(fakeNftMarketplace.address, CRYPTODEVS_NFT_CONTRACT_ADDRESS, {
    // This assumes your account has at least 1 ETH in it's account
    // Change this value as you want
    value: ethers.utils.parseEther("0.08"),
  });
  await cryptoDevsDAO.deployed();

  console.log("CryptoDevsDAO deployed to: ", cryptoDevsDAO.address);
  const txn = await cryptoDevsDAO.createProposal(2, { gasLimit: gas, gasPrice: gasPrice });
  await txn.wait();
  console.log("created proposal", txn);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
