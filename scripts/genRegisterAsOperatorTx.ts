import { Wallet, ethers } from "ethers";
import { avsGovernanceSmartContractAbi } from "../src/avsGovernanceAbi";
import { terminalFooter, terminalHeader } from "./utils";
import fs from 'fs';
import delegationManagerConfig from '../data/delegationManagerConfig.json';
import path from "path";

const OUT_DIR = '.othentic';
const JSON_FORMAT = 'othentic-evm-transaction-data';
const JSON_OUT_FILE = `${JSON_FORMAT}.json`;
const SHOW_SIMULATE_FORGE_SCRIPT = false;
// ts-node scripts/genRegisterAsOperatorTx.ts 0xbf01285ce61c332e151a33e48d178d9c77a5c58c3f706527c40d131897bc5e4f .othentic/othentic-avs-register-as-operator.json 0x02c13D68F7194F9741DBfDdC65e6a58979A9dfcd https://holesky.gateway.tenderly.co XXX
async function main() {
    terminalHeader();
    if (process.argv.length < 6) {
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
    const registerAsOperatorData = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
    const { chainId: chainIdStr, operator, avs, blsKey, blsRegistrationSignature } = registerAsOperatorData;
    const chainId = BigInt(chainIdStr);
    console.log('Generating register as allowed operator transaction\n\n\n');
    console.log(`operator: ${operator}`);
    console.log(`AVS: ${avs}`);
    console.log(`chainId: ${chainId}`);
    const avsDirectory = chainIdToDelegationManagerAddress(chainIdStr);
    if (!avsDirectory) {
        console.log(`ChainId ${chainId} not supported`);
        terminalFooter();
        process.exit(0);
    }
    console.log(`AVS Directory: ${avsDirectory}`);
    const { signature, salt, expiry } = await generateOperatorSignature(wallet, operator, avs);
    console.log(`\n\n`);
    console.log(`eigenDigestSignature:\n`);
    console.log(`\tsignature: ${signature}`);
    console.log(`\tsalt: ${salt}`);
    console.log(`\texpiry: ${expiry}`);
    console.log(`\n\n`);

    const avsGovernance = new ethers.Contract(
        avs,
        avsGovernanceSmartContractAbi,
        wallet, 
        );
        const tx = await avsGovernance.registerAsOperator.populateTransaction({
            blsKey, 
            rewardsReceiver: RECEIVER_ADDRESS, 
            blsRegistrationSignature: {signature: blsRegistrationSignature}, 
            authToken: AUTH_TOKEN ? AUTH_TOKEN : ethers.ZeroHash,
          }
          );
    console.log(`Register on AVS tx to be sent:\n`);
    console.log(`\tto: ${tx.to}`);
    console.log(`\tdata: ${tx.data}`);
    console.log(`\n\n`);

    // register operator to eigenLayer 
    const registerToEigenTestnetTx = await avsGovernance.registerOperatorToEigenLayer.populateTransaction({
            signature, 
            salt, 
            expiry
          },
          AUTH_TOKEN ? AUTH_TOKEN : ethers.ZeroHash
          );
    console.log(`Register on Operator to eigen tx to be sent (operator need to register to Eigen separately)\nhttps://github.com/Layr-Labs/eigenlayer-contracts/blob/main/src/contracts/core/DelegationManager.sol#L95:\n`);
    console.log(`\tto: ${registerToEigenTestnetTx.to}`);
    console.log(`\tdata: ${registerToEigenTestnetTx.data}`);
    console.log(`\n\n`);

    if (SHOW_SIMULATE_FORGE_SCRIPT) {
        console.log(`Simulate:\n`);
        console.log(`forge script GetCallDataTrace --sig="run(string,address,address,bytes)" ${RPC} ${operator} ${tx.to} ${tx.data} -vvvv`);
        console.log(`\n*for submit use --private-key <SMART_WALLET_MANAGER_ECDSA_KEY> --brodcast`)
        console.log(`\n\n`);
    }
    const outJson = { format: JSON_FORMAT, version: '1.0.0', ...tx };
    if (!fs.existsSync(OUT_DIR)) {
        fs.mkdirSync(OUT_DIR);
    }
    const outJsonPath = path.join(OUT_DIR, JSON_OUT_FILE);
    const outJsonAsString = JSON.stringify(outJson, null, 2);
    fs.writeFileSync(outJsonPath, outJsonAsString);
    // console.log(`\n\n${outJsonAsString}`);
    console.log(
        `\njson file stored: \n${path.join(process.cwd(), outJsonPath)}`
    );
    terminalFooter();

    function chainIdToDelegationManagerAddress(chainId: string): string {
        return chainId in delegationManagerConfig && delegationManagerConfig[chainId];
    }

    async function generateOperatorSignature(validator: Wallet, operatorAddress: string, avsGovernanceAddress: string): Promise<{ signature: string, salt: string, expiry: BigInt }> {
        const { digestHashArray, salt } = await calculateOperatorAVSRegistrationDigestHash(avsGovernanceAddress, validator, operatorAddress);
        const signature = validator.signingKey.sign(digestHashArray);
        const packedSig = ethers.solidityPacked(["bytes", "bytes", "uint8"], [signature.r, signature.s, signature.v]);
        const expiry = ethers.MaxUint256;
        return { signature: packedSig, salt, expiry };
    }

    async function calculateOperatorAVSRegistrationDigestHash(network: string, wallet: Wallet, operatorAddress: string): Promise<{ digestHashArray: Uint8Array, salt: string }> {
        const eigenManager = new ethers.Contract(
        avsDirectory,
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
}

main().catch(console.error);
