import fs from 'fs';
import path from 'path';
import { ethers } from "ethers";
import { terminalFooter, terminalHeader } from "../utils";

const OUT_DIR = '.othentic';
const JSON_FORMAT = 'othentic-allowlist-request-signature';
const JSON_FILE = `${JSON_FORMAT}.json`;

async function main() {
  terminalHeader();

  if (process.argv.length < 5) {
    console.log(`missing arguments. run:\n`)
    console.log(`ts-node ${__filename.substring(process.cwd().length+1)} <OWNER_PRIVATE_KEY> <WALLET> <AVS_GOVERNANCE>`);
    terminalFooter();
    process.exit(0);
}
const [,, OWNER_PRIVATE_KEY, WALLET, AVS_GOVERNANCE] = process.argv;

  const signer = new ethers.Wallet(OWNER_PRIVATE_KEY);
  console.log('Signer address:', signer.address);
  console.log('Smart wallet address:', WALLET)
  console.log('Avs address:', AVS_GOVERNANCE)

  const payloadHash = ethers.keccak256(ethers.toUtf8Bytes(`${WALLET}${AVS_GOVERNANCE}`));
  const signature = signer.signingKey.sign(ethers.getBytes(payloadHash)).serialized;
  console.log(
    `\n\npayloadHash: \n${payloadHash}`
  );
  console.log(
    `\nsignature: \n${signature}`
  );
  const outJson = { format: JSON_FORMAT, version: '1.0.0', wallet: WALLET, avsGovernanceAddress: AVS_GOVERNANCE, signature, isSmartWallet: true };
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

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });