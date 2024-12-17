import { Wallet, ethers } from "ethers";
import { avsGovernanceSmartContractAbi } from "../src/avsGovernanceAbi";
import { terminalFooter, terminalHeader } from "./utils";
import fs from 'fs';

const AVS_DIRECTORY = '0x055733000064333CaDDbC92763c58BF0192fFeBf';

async function main() {
    terminalHeader();
    if (process.argv.length < 7) {
        console.log(`ts-node scripts/${__filename.substring(process.cwd().length+1)} <ECDSA_PRIVATE_KEY> <JSON_FILE> <RECEIVER_ADDRESS> <AUTH_TOKEN> <RPC>`);
        terminalFooter();
        process.exit(0);
    }
    const [,, ECDSA_PRIVATE_KEY, JSON_FILE, RECEIVER_ADDRESS, AUTH_TOKEN, RPC] = process.argv;
    if (!fs.existsSync(JSON_FILE)) {
        console.log(`json file not found: ${JSON_FILE}`);
        terminalFooter();
        process.exit(0);
    }
    const wallet = new Wallet(ECDSA_PRIVATE_KEY, new ethers.JsonRpcProvider(RPC));
    const registerAsOperatorData = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
    const { chainId: chainIdStr, operator, avs, blsKey, blsRegistrationSignature } = registerAsOperatorData;
    const chainId = BigInt(chainIdStr);

    console.log('Generating register as allowed operator transaction\n\n\n');
    console.log(`operator: ${operator}`);
    console.log(`AVS: ${avs}`);
    console.log(`chainId: ${chainId}`);

    const { signature, salt, expiry } = await generateOperatorSignature(wallet, operator, avs);
    console.log(`\n\n`);
    console.log(`eigenDigestSignature:\n`);
    console.log(`\tsignature: ${signature}`);
    console.log(`\tsalt: ${salt}`);
    console.log(`\texpiry: ${expiry}`);
    console.log(`\n\n`);

    const avsGovernance = new ethers.Contract(
        AVS_DIRECTORY,
        avsGovernanceSmartContractAbi,
        wallet, 
        );
    const tx = await avsGovernance.registerAsOperator.populateTransaction(blsKey, RECEIVER_ADDRESS, { signature, salt, expiry }, { signature: blsRegistrationSignature });
    console.log(`Register on AVS tx to be sent:\n`);
    console.log(`\tto: ${tx.to}`);
    console.log(`\tdata: ${tx.data}`);
    console.log(`\n\n\n\n\n`);
    console.log(`Simulate:\n`);
    console.log(`forge script GetCallDataTrace --sig="run(string,address,address,bytes)" ${RPC} ${operator} ${tx.to} ${tx.data} -vvvv`);
    console.log(`\n*for submit use --private-key <SMART_WALLET_MANAGER_ECDSA_KEY> --brodcast`)
    console.log(`\n\n`);

    terminalFooter();
}

main().catch(console.error);



async function generateOperatorSignature(validator: Wallet, operatorAddress: string, avsGovernanceAddress: string): Promise<{ signature: string, salt: string, expiry: BigInt }> {
    const { digestHashArray, salt } = await calculateOperatorAVSRegistrationDigestHash(avsGovernanceAddress, validator, operatorAddress);
    const signature = validator.signingKey.sign(digestHashArray);
    const packedSig = ethers.solidityPacked(["bytes", "bytes", "uint8"], [signature.r, signature.s, signature.v]);
    //TODO: fetch this value from operator in the command (set default as max uint) 
    const expiry = ethers.MaxUint256;
    return { signature: packedSig, salt, expiry };
}

async function calculateOperatorAVSRegistrationDigestHash(network: string, wallet: Wallet, operatorAddress: string): Promise<{ digestHashArray: Uint8Array, salt: string }> {
    const eigenManager = new ethers.Contract(
      AVS_DIRECTORY,
      ['function calculateOperatorAVSRegistrationDigestHash(address operator,address avs,bytes32 salt,uint256 expiry) external view returns (bytes32)'],
      wallet, 
    );

    const salt = ethers.encodeBytes32String(Math.random().toString());

    try {
      const digestHashArray = await eigenManager.calculateOperatorAVSRegistrationDigestHash(operatorAddress, network, salt, ethers.MaxUint256);
      return { digestHashArray , salt };
    } catch (e) {
      this.othenticSmartContracts.handleOthenticSmartContractErrors(e, false);
    }
  }

