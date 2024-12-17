import { ethers } from "ethers";
import { terminalFooter, terminalHeader } from "./utils";

async function main() {
    terminalHeader();
    console.log('Generating bls key...\n\n\n');
    console.log(`bls private key: ${ethers.Wallet.createRandom().privateKey}`);
    terminalFooter();
}

main().catch(console.error);

