import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { Contract, providers } from "ethers";
import { formatEther } from "ethers/lib/utils";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import { abi as CRYPTODEVS_DAO_ABI } from "../constants/CryptoDevDAO.json";
import { abi as CRYPTODEVS_NFT_ABI } from "../constants/CryptoDevs.json";

import { Triangle } from "react-loader-spinner";
// import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";

const CRYPTODEVS_DAO_CONTRACT_ADDRESS = "0xc478DF9698BaeE05F0E3483D2C15cfDDD36542B7";
const CRYPTODEVS_NFT_CONTRACT_ADDRESS = "0xb42BeD20683D67d43844aD9f0B33C3a80CbeFC49";

export default function Home() {
  const GITHUB_LINK = "https://github.com/HiberNuts";
  const [treasuryBalance, setTreasuryBalance] = useState("0");

  const [numProposals, setNumProposals] = useState("0");
  const [nftBalance, setNftBalance] = useState(0);
  const [proposals, setProposals] = useState([]);

  const [fakeNftTokenId, setFakeNftTokenId] = useState("");
  const [selectedTab, setSelectedTab] = useState("");

  const [loading, setLoading] = useState(false);

  const [walletConnected, setWalletConnected] = useState(false);
  const web3ModalRef = useRef();

  const connectWallet = async () => {
    try {
      await getProvidersOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
  };

  const getDAOTreasuryBalance = async () => {
    try {
      const provider = await getProvidersOrSigner();
      const balance = await provider.getBalance(CRYPTODEVS_DAO_CONTRACT_ADDRESS);
      setTreasuryBalance(balance.toString());
    } catch (error) {
      console.error(error);
    }
  };

  const getNumProposalsInDAO = async () => {
    try {
      const provider = await getProvidersOrSigner();
      // const data = await provider.getCode("0x730f5a30BdCCAb9DFBf7a8a82d77d6EB62ACe108");
      // console.log("HERE!!", data);

      const contract = getDaoContractInstance(provider);
      const daoNumProposals = await contract.numProposals();
      setNumProposals(daoNumProposals.toString());
    } catch (error) {
      console.error(error);
    }
  };

  const getUserNFTBalance = async () => {
    try {
      const signer = await getProvidersOrSigner(true);
      const nftContract = getCryptodevsNFTContractInstance(signer);
      const balance = await nftContract.balanceOf(signer.getAddress());
      console.log(signer.getAddress());
      setNftBalance(parseInt(balance.toString()));
    } catch (error) {
      console.error(error);
    }
  };

  const createProposal = async () => {
    try {
      const signer = await getProvidersOrSigner(true);
      const daoContract = getDaoContractInstance(signer);
      const txn = await daoContract.createProposal(fakeNftTokenId, { gasLimit: 100000 });
      setLoading(true);
      await txn.wait();
      await getNumProposalsInDAO();
      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  

  const fetchProposalById = async (id) => {
    try {
      const provider = await getProvidersOrSigner();
      const daoContract = getDaoContractInstance(provider);

      const proposal = await daoContract.proposals(id);
      const parsedProposal = {
        proposalId: id,
        nftTokenId: proposal.nftTokenId.toString(),
        deadline: new Date(parseInt(proposal.deadline.toString()) * 1000),
        yayVotes: proposal.yayVotes.toString(),
        nayVotes: proposal.nayVotes.toString(),
        executed: proposal.executed,
      };

      return parsedProposal;
    } catch (error) {
      console.error(error);
    }
  };

  //fetch all proposal

  const fetchAllProposals = async () => {
    try {
      const proposals = [];

      for (let i = 0; i < numProposals; i++) {
        const proposal = await fetchProposalById(i);
        proposals.push(proposal);
      }
      setProposals(proposals);
      return proposals;
    } catch (error) {
      console.error(error);
    }
  };

  //vote on proposal

  const voteOnProposal = async (proposalId, _vote) => {
    try {
      const signer = await getProvidersOrSigner(true);
      const daoContract = getDaoContractInstance(signer);

      let vote = _vote === "YAY" ? 0 : 1;
      const txn = await daoContract.voteOnProposal(proposalId, vote);
      setLoading(true);
      await txn.wait();
      setLoading(false);
      await fetchAllProposals();
    } catch (error) {
      console.error(error);
    }
  };

  const executeProposal = async (proposalId) => {
    try {
      const signer = await getProvidersOrSigner(true);
      const daoContract = getDaoContractInstance(signer);
      const txn = await daoContract.executeProposal(proposalId);
      setLoading(true);
      await txn.wait();
      setLoading(false);
      await fetchAllProposals();
    } catch (error) {
      console.error(error);
    }
  };

  const getProvidersOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const { chainId } = await web3Provider.getNetwork();
    console.log(web3Provider.getCode("0x730f5a30bdccab9dfbf7a8a82d77d6eb62ace108"));
    if (chainId !== 5) {
      window.alert("Please switch to the GOERLi network!");
      throw new Error("Please switch to the GOERLi network");
    }
    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const getDaoContractInstance = (providerOrSigner) => {
    return new Contract(CRYPTODEVS_DAO_CONTRACT_ADDRESS, CRYPTODEVS_DAO_ABI, providerOrSigner);
  };

  // Helper function to return a CryptoDevs NFT Contract instance
  // given a Provider/Signer
  const getCryptodevsNFTContractInstance = (providerOrSigner) => {
    return new Contract(CRYPTODEVS_NFT_CONTRACT_ADDRESS, CRYPTODEVS_NFT_ABI, providerOrSigner);
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      connectWallet().then(() => {
        getDAOTreasuryBalance();
        getUserNFTBalance();
        getNumProposalsInDAO();
      });
    }
  });

  useEffect(() => {
    if (selectedTab === "View Proposals") {
      fetchAllProposals();
    }
  }, [selectedTab]);

  // Render the contents of the appropriate tab based on `selectedTab`
  function renderTabs() {
    if (selectedTab === "Create Proposal") {
      return renderCreateProposalTab();
    } else if (selectedTab === "View Proposals") {
      return renderViewProposalsTab();
    }
    return null;
  }

  function renderCreateProposalTab() {
    if (loading) {
      <Triangle
        height="80"
        width="80"
        color="#FFFFFF"
        ariaLabel="triangle-loading"
        wrapperStyle={{}}
        wrapperClassName=""
        visible={true}
      />;
    } else if (nftBalance === 0) {
      return (
        <div className={styles.description}>
          You dont not own any CryptoDevs NFT's
          <br />
          <b>You cannot create or vote on proposals</b>
        </div>
      );
    } else {
      return (
        <div className={styles.container}>
          <label>NFT Token ID to Purchase:</label>
          <input placeholder="0" type="number" onChange={(e) => setFakeNftTokenId(e.target.value)} />
          <button className={styles.button2} onClick={createProposal}>
            Create
          </button>
        </div>
      );
    }
  }

  function renderViewProposalsTab() {
    if (loading) {
      <Triangle
        height="80"
        width="80"
        color="#FFFFFF"
        ariaLabel="triangle-loading"
        wrapperStyle={{}}
        wrapperClassName=""
        visible={true}
      />;
    } else if (proposals.length === 0) {
      return <div className={styles.description}>No proposals have been created</div>;
    } else {
      return proposals.map((p, index) => (
        <div key={index} className={styles.proposalCard}>
          <p>Proposal ID: {p.nftTokenId}</p>
          <p>NFT to Purchase:{p.nftTokenId} </p>
          <p>Deadline: {p.deadline.toLocaleString()} </p>
          <p>Yay Votes: {p.yayVotes}</p>
          <p>Nay Votes: {p.nayVotes}</p>
          <p>Executed?: {p.executed.toString()}</p>

          {p.deadline.getTime() > Date.now() && !p.executed ? (
            <div className={styles.flex}>
              <button className={styles.button2} onClick={() => voteOnProposal(p.proposalId, "YAY")}>
                Vote YAY
              </button>
              <button className={styles.button2} onClick={() => voteOnProposal(p.proposalId, "NAY")}>
                Vote NAY
              </button>
            </div>
          ) : p.deadline.getTime() < Date.now() && !p.executed ? (
            <div className={styles.flex}>
              <button className={styles.button2} onClick={() => executeProposal(p.proposalId)}>
                Execute Proposal {p.yayVotes > p.nayVotes ? "(YAY)" : "(NAY)"}
              </button>
            </div>
          ) : (
            <div className={styles.description}>Proposal Executed</div>
          )}
        </div>
      ));
    }
  }

  return (
    <div>
      <Head>
        <title>Crypto Devs DAO</title>
        <meta name="description" content="CryptoDevs DAO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Dev</h1>
          <div className={styles.description}>Welcome to the DAO!</div>
          <div className={styles.description}>
            Your CryptoDevs NFT Balance: {nftBalance}
            <br />
            Treasury Balance: {formatEther(treasuryBalance)} ETH
            <br />
            Total Number of Proposals: {numProposals}
          </div>
          <div className={styles.flex}>
            <button className={styles.button} onClick={() => setSelectedTab("Create Proposal")}>
              Create Proposal
            </button>
            <button
              style={{ marginTop: "20px" }}
              className={styles.button}
              onClick={() => setSelectedTab("View Proposals")}
            >
              View Proposals
            </button>
          </div>
          {renderTabs()}
        </div>
        <div>
          <img className={styles.image} src="" />
        </div>
      </div>
      <div style={{ backgroundColor: "white", zIndex: 100 }} className={styles.footerContainer}>
        <img alt="Twitter Logo" className={styles.twitterLogo} src="./github.svg" />
        <a className={styles.footerText} href={GITHUB_LINK} target="_blank" rel="noreferrer">
          built by HiberNuts
        </a>
      </div>
    </div>
  );
}
