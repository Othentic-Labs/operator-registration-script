import fs from 'fs';
import { ethers } from "ethers";
import { terminalFooter, terminalHeader } from "../utils";

async function main() {
    terminalHeader();

    if (process.argv.length < 2) {
      console.log(`missing arguments. run:\n`)
      console.log(`ts-node ${__filename.substring(process.cwd().length+1)} <JSON_FILE> <RPC>`);
      terminalFooter();
      process.exit(0);
    }
    const [,, JSON_FILE, RPC] = process.argv;
    if (!fs.existsSync(JSON_FILE)) {
      console.log(`json file not found: ${JSON_FILE}`);
      terminalFooter();
      process.exit(0);
    }
    const { wallet, avsGovernanceAddress, signature, isSmartWallet } = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
    console.log(`Smart Wallet Signature Validation...\n\n`);
    console.log('from json file:', JSON_FILE);
    console.log();
    console.log('Smart wallet address:', wallet);
    console.log('AvsGovernance address:', avsGovernanceAddress);
    console.log('Signature:', signature);
  
    const smartWalletContract = new ethers.Contract(wallet, ["function isValidSignature(bytes32, bytes calldata) external view returns (bytes4)"], new ethers.JsonRpcProvider(RPC));
    const payloadHash = ethers.keccak256(ethers.toUtf8Bytes(`${wallet}${avsGovernanceAddress}`));
    const isValidSignature = await smartWalletContract.isValidSignature(payloadHash, signature) === '0x1626ba7e';
    console.log(
      `\n\nis valid: \n${isValidSignature}`
    );
    terminalFooter();
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });