# Register a Smart Account (Safe) as an AVS Operator

This guide walks you through deploying an **EIP-1271-compatible fallback handler**, assigning it to your Safe on Holesky, and registering the Safe as an AVS operator using the Othentic Stack.

### 🔹 Step 1: Create a Smart Account (Safe)

- Visit [https://holesky-safe.protofire.io](https://holesky-safe.protofire.io/)
- Deploy a new Safe (multisig or single owner)
    
    → Example Safe: [`0xcB6Efd3D763d96074552Ae548fdBF28B6A0EC621`](https://holesky.etherscan.io/address/0xcB6Efd3D763d96074552Ae548fdBF28B6A0EC621)
    

### 🔹 Step 2: Deploy Fallback Handler for EIP-1271

This contract allows your Safe to verify signatures in compliance with EIP-1271 — enabling smart contract signature validation by the AVS.

### `SafeSignatureValidator.sol`

```solidity
// SafeSignatureValidator.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@gnosis.pm/safe-contracts/contracts/GnosisSafe.sol";

contract SafeSignatureValidator is IERC1271 {
    bytes4 internal constant MAGIC_VALUE = 0x1626ba7e;
    address public immutable safe;

    constructor(address _safe) {
        safe = _safe;
    }

    function isValidSignature(bytes32 _hash, bytes memory _signature) external view override returns (bytes4) {
        address signer = recoverSigner(_hash, _signature);
        GnosisSafe safeContract = GnosisSafe(payable(safe));

        require(safeContract.isOwner(signer), "Invalid signature");

        return MAGIC_VALUE;
    }

    function recoverSigner(bytes32 _hash, bytes memory _signature) public pure returns (address) {
        require(_signature.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }

        if (v < 27) v += 27; // Adjust v value

        return ecrecover(_hash, v, r, s);
    }
}

```

### 🔹 Step 3: Deploy the Validator Contract

### `scripts/deploy.js`

```solidity
async function main() {
    const safeAddress = "0xcb6efd3d763d96074552ae548fdbf28b6a0ec621"; // 🔁 Replace with actual Safe address

    const SafeSignatureValidator = await ethers.getContractFactory("SafeSignatureValidator");
    const myToken = await SafeSignatureValidator.deploy(safeAddress);

    await myToken.deployed();

    console.log("SafeSignatureValidator deployed to:", await myToken.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
```

→ Example Deployed Address: [`0x34e831fb109E969dc0690B040E303985479923Df`](https://holesky.etherscan.io/address/0x34e831fb109E969dc0690B040E303985479923Df)

### 🔹 Step 4: Set This Contract as Your Safe's Fallback Handler

> You must use the Safe itself (via WalletConnect or delegate call) to update the fallback handler — not your EOA.
> 
- Open Safe contract on Etherscan
- Use “Write Contract” > setFallBackHandler function
- Input the deployed `SafeSignatureValidator` address
- Submit transaction and confirm via Safe

→ Example transaction:  [0x8d017a25c3302891f594cfa6c45f663c4e51e378677f331ae3aa2c57f8740bcb](https://holesky.etherscan.io/tx/0x8d017a25c3302891f594cfa6c45f663c4e51e378677f331ae3aa2c57f8740bcb)

### 🔹 Step 5: Register Your Safe to the AVS

Follow [Operator registration scripts](https://github.com/Othentic-Labs/operator-registration-script/tree/main?tab=readme-ov-file#usage-guide)

> 💡 **Note:** If your Safe is a **multisig** , the **ECDSA_PRIVATE_KEY** used here can belong to **any one of the Safe owners.** This is used only to sign and prepare the transaction payload; the actual execution will still require quorum signatures from the Safe UI.
> 

```
ts-node scripts/genAvsRegisterBlsSignature.ts <BLS_PRIVATE_KEY> <AVS_GOVERNANCE_ADDRESS> <WALLET_ADDRESS> <RPC>

example:
ts-node scripts/genAvsRegisterBlsSignature.ts 0x959d00c65247d9e6863e27b8f0b7a59e994243b15001d1383db58df70000000 0x01b76eaB9706186c04024a9c28a927B80eBd6335 0xcB6Efd3D763d96074552Ae548fdBF28B6A0EC621 https://rpc.ankr.com/eth_holesky/

// Use allowlisting from the actual scripts If its required by the AVS 

ts-node scripts/genRegisterAsOperatorTx.ts <ECDSA_PRIVATE_KEY> <JSON_FILE> <REWARDS_RECEIVER_ADDRESS> <RPC> [<AUTH_TOKEN>]

example:
ts-node scripts/genRegisterAsOperatorTx.ts 0x00000000000000000000000000fa9a620b9af0e2c26aaae5aea386274b78207ab0 .othentic/othentic-avs-register-as-operator.json 0xcB6Efd3D763d96074552Ae548fdBF28B6A0EC621 https://rpc.ankr.com/eth_holesky/
```

### 🔹 Step 6: Submit the Operator Registration Transaction

1. Open the Safe UI.
2. Go to the **Transaction Builder (custom data)**.
3. Paste the raw transaction data from `.othentic/othentic-avs-register-as-operator.json`.
4. Submit and confirm using Safe owner signatures.

→ Example transaction:  [0xb5b3795c2ed6f81cd994529c6695e40e932fc50fdaf163042a8e4b39616e60a8](https://holesky.etherscan.io/tx/0xb5b3795c2ed6f81cd994529c6695e40e932fc50fdaf163042a8e4b39616e60a8)