import { Wallet, ethers } from "ethers";
import { avsGovernanceSmartContractAbi } from "../src/avsGovernanceAbi";
import { terminalFooter, terminalHeader } from "./utils";
import fs from 'fs';
import delegationManagerConfig from '../data/delegationManagerConfig.json';

// Sends the operator registration txs directly using a pre-generated
// allowlist auth-token signature (replaces the dead allowlistner.othentic.xyz
// flow). The auth token can be generated locally via
// scripts/allowlist/genAuthToken.ts when the signer's private key is available.
//
// Example:
//   ts-node scripts/registerOperatorWithSig.ts <ECDSA_PRIVATE_KEY> <JSON_FILE> <RECEIVER_ADDRESS> <RPC> <AUTH_TOKEN>
async function main() {
    terminalHeader();
    if (process.argv.length < 7) {
        console.log(`ts-node ${__filename.substring(process.cwd().length+1)} <ECDSA_PRIVATE_KEY> <JSON_FILE> <RECEIVER_ADDRESS> <RPC> <AUTH_TOKEN>`);
        terminalFooter();
        process.exit(0);
    }
    const [,, ECDSA_PRIVATE_KEY, JSON_FILE, RECEIVER_ADDRESS, RPC, AUTH_TOKEN] = process.argv;
    if (!fs.existsSync(JSON_FILE)) {
        console.log(`json file not found: ${JSON_FILE}`);
        terminalFooter();
        process.exit(0);
    }

    const wallet = new Wallet(ECDSA_PRIVATE_KEY, new ethers.JsonRpcProvider(RPC));
    const { chainId: chainIdStr, operator, avs, blsKey, blsRegistrationSignature } = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
    const avsDirectory = (delegationManagerConfig as Record<string, string>)[chainIdStr];
    if (!avsDirectory) {
        console.log(`ChainId ${chainIdStr} not supported`);
        terminalFooter();
        process.exit(0);
    }

    console.log(`operator: ${operator}`);
    console.log(`AVS: ${avs}`);
    console.log(`chainId: ${chainIdStr}`);
    console.log(`AVS Directory: ${avsDirectory}`);
    console.log(`sender: ${wallet.address}`);

    const avsGovernance = new ethers.Contract(avs, avsGovernanceSmartContractAbi, wallet);
    const eigenSig = await generateOperatorSignature(wallet, operator, avs, avsDirectory);

    console.log(`\neigenDigestSignature:`);
    console.log(`\tsignature: ${eigenSig.signature}`);
    console.log(`\tsalt: ${eigenSig.salt}`);
    console.log(`\texpiry: ${eigenSig.expiry}`);

    let alreadyOnEigen = false;
    try {
      await avsGovernance.registerOperatorToEigenLayer.staticCall(eigenSig, AUTH_TOKEN);
    } catch (err: any) {
      if (err?.data === '0x354a5176') {
          console.log(`\nregisterOperatorToEigenLayer skipped: OperatorAlreadyRegisteredToAVS()`);
          alreadyOnEigen = true;
      } else {
          throw err;
      }
    }

    if (!alreadyOnEigen) {
        console.log(`\nSending registerOperatorToEigenLayer...`);
        const eigenTx = await avsGovernance.registerOperatorToEigenLayer(eigenSig, AUTH_TOKEN);
        console.log(`\ttx: ${eigenTx.hash}`);
        const eigenReceipt = await eigenTx.wait();
        console.log(`\tmined in block ${eigenReceipt?.blockNumber}`);
    }

    console.log(`\nSending registerAsOperator...`);
    const tx = await avsGovernance.registerAsOperator({
        blsKey,
        rewardsReceiver: RECEIVER_ADDRESS,
        blsRegistrationSignature: { signature: blsRegistrationSignature },
        authToken: AUTH_TOKEN,
    });
    console.log(`\ttx: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`\tmined in block ${receipt?.blockNumber}`);

    terminalFooter();
}

async function generateOperatorSignature(validator: Wallet, operatorAddress: string, avsGovernanceAddress: string, avsDirectory: string) {
    const eigenManager = new ethers.Contract(
        avsDirectory,
        ['function calculateOperatorAVSRegistrationDigestHash(address operator,address avs,bytes32 salt,uint256 expiry) external view returns (bytes32)'],
        validator,
    );
    const salt = ethers.encodeBytes32String(Math.random().toString());
    const expiry = ethers.MaxUint256;
    const digestHashArray = await eigenManager.calculateOperatorAVSRegistrationDigestHash(operatorAddress, avsGovernanceAddress, salt, expiry);
    const sig = validator.signingKey.sign(digestHashArray);
    const signature = ethers.solidityPacked(["bytes", "bytes", "uint8"], [sig.r, sig.s, sig.v]);
    return { signature, salt, expiry };
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
