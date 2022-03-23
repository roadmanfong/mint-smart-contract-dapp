import { ethers } from "ethers";
import QubicProvider from "@qubic-js/browser";
import "./styles.css";
import abi from "./abi";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    ethereum: any;
  }
}

const ENABLE_QUBIC_SDK = true;
const CHAIN_ID = 4;
const MINT_PRICE = "0.18";
const NFT_ADDRESS = "0x366146057c41B0C4147F56c48675a3519917f6c8";
const INFURA_PROJECT_ID = "9aa3d95b3bc440fa88ea12eaa4456161";

const globalEthereumProvider = ENABLE_QUBIC_SDK
  ? new QubicProvider({
      apiKey: "",
      apiSecret: "",
      chainId: CHAIN_ID,
      infuraProjectId: INFURA_PROJECT_ID,
      enableIframe: false,
    })
  : window.ethereum;

export default function App() {
  const providerRef = useRef<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);

  const handleChainChanged = useCallback((chainId: string) => {
    setChainId(Number(chainId));
    if (Number(chainId) !== CHAIN_ID || !providerRef.current) {
      setIsConnected(false);
      setSigner(null);
      providerRef.current?.send("wallet_switchEthereumChain", [
        { chainId: ethers.utils.hexlify(CHAIN_ID) },
      ]);

      return;
    }
    setIsConnected(true);
    setSigner(providerRef.current.getSigner());
  }, []);

  useEffect(() => {
    globalEthereumProvider.on("chainChanged", handleChainChanged);
  }, [handleChainChanged]);

  useEffect(() => {
    globalEthereumProvider.on("disconnect", () => {
      setIsConnected(false);
    });
  }, []);

  const connect = useCallback(async () => {
    providerRef.current = new ethers.providers.Web3Provider(
      globalEthereumProvider,
      "any"
    );
    // const myAddress = await providerRef.current.
    // console.log({ address: myAddress });

    const accounts = await providerRef.current.send("eth_requestAccounts", []);
    console.log({
      accounts,
    });

    const network = await providerRef.current.getNetwork();
    handleChainChanged(network.chainId.toString());
  }, [handleChainChanged]);

  // useEffect(() => {
  //   connect();
  // }, [connect]);

  const [nftAmount, setNftAmount] = useState("1");

  const mint = useCallback(async () => {
    if (!providerRef.current || !signer) {
      return;
    }
    // This can be an address or an ENS name
    const nftContract = new ethers.Contract(NFT_ADDRESS, abi, signer);

    // nftContract.connect(signer).mint(ethers.BigNumber.from(nftAmount));
    nftContract.mint(ethers.BigNumber.from(nftAmount), {
      value: ethers.utils.parseEther(MINT_PRICE).mul(nftAmount),
    });
  }, [nftAmount, signer]);

  return (
    <div className="App">
      <h1>Test Mint Dapp</h1>

      {chainId && <h3>Network: {ethers.providers.getNetwork(chainId).name}</h3>}

      <h3>
        {chainId &&
          chainId !== CHAIN_ID &&
          `WRONG Chain id, we only support ${
            ethers.providers.getNetwork(CHAIN_ID).name
          }`}
      </h3>
      {isConnected ? (
        <>
          <div>
            <input
              type="number"
              value={nftAmount}
              onChange={(event) => {
                setNftAmount(event.target.value);
              }}
            />
          </div>
          <br />
          <div>
            <input type="button" value="Mint" onClick={mint} />
          </div>
        </>
      ) : (
        <input type="button" value="Connect" onClick={connect} />
      )}
    </div>
  );
}
