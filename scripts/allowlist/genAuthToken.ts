import 'dotenv/config';
import { ethers } from "ethers";
import { terminalFooter, terminalHeader } from "../utils";

// Local replica of the Othentic Allowlister-AVS token-generator service
// (see Othentic-Labs/Allowlister-AVS src/tokenGenerator.service.js).
// Use when the hosted allowlist-signer service is unavailable and you
// hold the allowlist signer's private key.
//
// Reads from .env:
//   SIGNER_PRIVATE_KEY     - allowlist signer's private key
//   WALLET_ADDRESS         - operator wallet address (EOA / smart wallet / multisig)
//   AVS_GOVERNANCE_ADDRESS - AVS Governance contract address
async function main() {
    terminalHeader();

    const { SIGNER_PRIVATE_KEY, WALLET_ADDRESS, AVS_GOVERNANCE_ADDRESS } = process.env;
    const missing = ['SIGNER_PRIVATE_KEY', 'WALLET_ADDRESS', 'AVS_GOVERNANCE_ADDRESS']
        .filter((k) => !process.env[k]);
    if (missing.length) {
        console.log(`missing env vars in .env: ${missing.join(', ')}`);
        terminalFooter();
        process.exit(1);
    }

    const signer = new ethers.Wallet(SIGNER_PRIVATE_KEY!);
    const payload = ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'address'],
        [AVS_GOVERNANCE_ADDRESS, WALLET_ADDRESS],
    );
    const payloadHash = ethers.keccak256(payload);
    const authToken = await signer.signMessage(ethers.getBytes(payloadHash));

    console.log(`Signer address: ${signer.address}`);
    console.log(`Operator wallet: ${WALLET_ADDRESS}`);
    console.log(`AVS Governance: ${AVS_GOVERNANCE_ADDRESS}`);
    console.log(`\nauthToken:\n${authToken}\n`);

    terminalFooter();
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
