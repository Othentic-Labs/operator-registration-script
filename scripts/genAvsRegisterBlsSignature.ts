import { mclFR, solG1 } from "../src/mcl";
import { Wallet, ethers } from "ethers";
import * as mcl from '../src/mcl';
import { terminalFooter, terminalHeader } from "./utils";
import fs from 'fs';
import path from "path";

const OUT_DIR = '.othentic';
const JSON_FORMAT = 'avs-register-as-operator';
const JSON_FILE = `${JSON_FORMAT}.json`;
//
// example:
// ts-node scripts/genAvsRegisterBlsSignature.ts 0x1aa4829bdf0461d6fc1d9cfb0de78eec4b142fc722112fd0369c407d03ad3adb 0x8B8136fB6A8ea7AbA61d88da5753D8fEa2d7d5b2 0x02c13D68F7194F9741DBfDdC65e6a58979A9dfcd https://holesky.gateway.tenderly.co
//
async function main() {
    terminalHeader();

    if (process.argv.length < 6) {
        console.log(`missing arguments. run:\n`)
        console.log(`ts-node ${__filename.substring(process.cwd().length+1)} <BLS_PRIVATE_KEY> <AVS_GOVERNANCE_ADDRESS> <SMART_WALLET_ADDRESS> <RPC>`);
        terminalFooter();
        process.exit(0);
    }
    const [,, BLS_PRIVATE_KEY, AVS_GOVERNANCE_ADDRESS, SMART_WALLET_ADDRESS, RPC] = process.argv;

    console.log('Generating signature for operator registration...\n\n\n');
    console.log(`operator: ${SMART_WALLET_ADDRESS} (smart wallet eip-1271)`);
    console.log(`AVS: ${AVS_GOVERNANCE_ADDRESS}`);

    await mcl.init();

    const chainId = await fetchChainIdFromRpc(RPC);
    console.log(`chain: ${chainId}\n\n\n`);

    const seed = BLS_PRIVATE_KEY;
    const secret = seedToSecret(seed);
    const pubkey = secretToPubkey(secret);

    console.log(
        `blsKey: \n${mcl.g1ToHex(pubkey)}`
    );
    const blsRegistrationSignature = await generateBlsAuthSignature(secret, chainId, SMART_WALLET_ADDRESS, AVS_GOVERNANCE_ADDRESS);
    console.log(
        `\nblsRegistrationSignature: \n${blsRegistrationSignature[0] + (blsRegistrationSignature[1] as string).substring(2)}`
    );

    const outJson = { format: JSON_FORMAT, version: '1.0.0', operator: SMART_WALLET_ADDRESS, avs: AVS_GOVERNANCE_ADDRESS, blsKey: mcl.g2ToHex(pubkey), blsRegistrationSignature };
    if (!fs.existsSync(OUT_DIR)) {
        fs.mkdirSync(OUT_DIR);
    }
    const outJsonPath = path.join(OUT_DIR, JSON_FILE);
    const outJsonAsString = JSON.stringify(outJson, null, 2);
    fs.writeFileSync(outJsonPath, outJsonAsString);
    // console.log(`\n\n${outJsonAsString}`);
    console.log(
        `\n\njson file stored: \n${path.join(process.cwd(), outJsonPath)}`
    );
    terminalFooter();
}

main().catch(console.error);


function seedToSecret(seedInHex: string) {
    return mcl.parseFr(seedInHex);
}

function secretToPubkey(secret: mclFR) {
    return mcl.getPubkey(secret);
}

async function generateBlsAuthSignature(blsSecret: string, chainId: bigint, validatorAddress: string, avsGovernanceAddress: string): Promise<solG1> {
    const domain = ethers.getBytes(ethers.solidityPackedKeccak256(['string'], ['OthenticBLSAuth']));
    const message = ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'address', 'uint256'], 
        [validatorAddress, avsGovernanceAddress, chainId]
    );
    const messageHash = ethers.keccak256(message);
    const { signature: signatureMcl } = mclSign(messageHash, blsSecret, ethers.getBytes(domain));
    return mcl.g1ToHex(signatureMcl);
}

function mclSign(message: string, secret: mclFR, domain: Uint8Array) {
    return mcl.sign(message, secret, domain);
}

async function fetchChainIdFromRpc(rpc: string) {
    const smartWalletManager = new Wallet(Wallet.createRandom().privateKey, new ethers.JsonRpcProvider(rpc))
    return await smartWalletManager.provider.getNetwork().then(network => network.chainId);
}