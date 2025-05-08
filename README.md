# Operator Registration Scripts

A comprehensive set of scripts for registering as an EigenLayer AVS operator, designed to work with various wallet types including EOAs, multisigs, and smart accounts.

## Overview

This toolkit provides a streamlined process for generating the necessary signatures and transaction payloads required to register as an operator in the Othentic AVS system. It handles:

- BLS key generation and signing
- EigenLayer registration signature creation
- Allowlist authentication
- Smart wallet/multisig integration
- Transaction payload generation

## Prerequisites

- Node.js v22.6+ (installation via NVM recommended)
- OpenSSL
- For allowlisted operators: auth token from Othentic [OPTIONAL]

## Installation

```bash
# Clone the repository
git clone https://github.com/Othentic-Labs/operator-registration-script.git
cd operator-registration-script

# Install dependencies
npm install
npm install -g ts-node typescript
```

## Usage Guide

Operator registration requires two keys, Controller (ECDSA key) and Consensus (BLS key). It is highly advised to use different keys for both. By utilizing a separate Consensus key, the Operator's private key (controller key) does not need to be stored in the `.env` file, significantly reducing the risk of hacks.

The registration process involves several steps, each handled by a dedicated script:

### 1. Generate BLS Signature

This step creates the BLS signature to attest task validity or invalidity in the P2P networking layer.


```bash
ts-node scripts/genAvsRegisterBlsSignature.ts <BLS_PRIVATE_KEY> <AVS_GOVERNANCE_ADDRESS> <WALLET_ADDRESS> <RPC>
```

Parameters:
- `BLS_PRIVATE_KEY`: Your operator's BLS key, the Consensus Key is used exclusively as a BLS key.
- `AVS_GOVERNANCE_ADDRESS`: The Othentic AVS governance contract address
- `WALLET_ADDRESS`: Your wallet address (EOA, smart contract, multisig, etc.)
- `RPC`: URL of the Ethereum RPC endpoint

Example:
```bash
ts-node scripts/genAvsRegisterBlsSignature.ts 0x1aa4829bdf0461d6fc1d9cfb0de78eec4b142fc722112fd0369c407d03ad3adb 0x8B8136fB6A8ea7AbA61d88da5753D8fEa2d7d5b2 0x02c13D68F7194F9741DBfDdC65e6a58979A9dfcd https://holesky.gateway.tenderly.co
```

Output will be stored in `.othentic/othentic-avs-register-as-operator.json`.

### 2. Generate Auth token for allow listing (Optional)
If the AVS is allowlist-enabled, you will also need to generate an `AUTH_TOKEN`

#### a. Generate Signature for Allowlist Service 

Run this script to generate the signature required to generate auth token.

```bash
ts-node scripts/allowlist/generateSignature.ts <PRIVATE_KEY> <WALLET_ADDRESS> <AVS_GOVERNANCE_ADDRESS>
```

Parameters:
- `PRIVATE_KEY`: Operator ecdsa private key or Private key of the Operator's signer (for smart wallets and multisigs)
- `WALLET_ADDRESS`: Address of the smart wallet or multisig
- `AVS_GOVERNANCE_ADDRESS`: Address of the AVS governance contract

Example:
```bash
ts-node scripts/allowlist/generateSignature.ts 6212d241a920a6d5d9841af933411d8d6141638c8f7d21a6b32594014ef0006e 0x7F2a575015946D06284E130b00944c5755c351f2 0x02c13D68F7194F9741DBfDdC65e6a58979A9dfcd
```

Output will be stored in `.othentic/othentic-allowlist-request-signature.json`.

#### b. Validate Allowlist Signature 

Verify that your allowlist signature is valid before submitting to the allowlist service.

```bash
ts-node scripts/allowlist/validateSignature.ts <JSON_FILE> <RPC>
```

Parameters:
- `JSON_FILE`: Path to the allowlist signature JSON from step 3
- `RPC`: URL of the Ethereum RPC endpoint

Example:
```bash
ts-node scripts/allowlist/validateSignature.ts .othentic/othentic-allowlist-request-signature.json https://holesky.gateway.tenderly.co
```


#### c. Submit Signature to the Allowlist Service

After generating the allowlist signature, submit it to the allowlist service:

```bash
curl --location 'http://allowlist-signer.othentic.xyz/signer/sign' \
--header 'Content-Type: application/json' \
--data '@.othentic/othentic-allowlist-request-signature.json'
```

The returned token can be used in next step as the `AUTH_TOKEN` parameter.

### 3. Generate Registration Transaction Payload

This step uses the output from `step 1` to generate the transaction data needed for registration.

```bash
ts-node scripts/genRegisterAsOperatorTx.ts <ECDSA_PRIVATE_KEY> <JSON_FILE> <REWARDS_RECEIVER_ADDRESS> <RPC> [<AUTH_TOKEN>]
```

Parameters:
- `ECDSA_PRIVATE_KEY`: Operator private key or Private key of the Operator's signer (for smart wallets and multisigs)
- `JSON_FILE`: Path to the JSON file generated in step 1
- `REWARDS_RECEIVER_ADDRESS`: Address that will receive the rewards (typically same as Operator address)
- `RPC`: URL of the Ethereum RPC endpoint
- `AUTH_TOKEN`: [Optional] Authentication token for allowlisted registrations, check `steps 3-5` to generate auth token.

Example:
```bash
ts-node scripts/genRegisterAsOperatorTx.ts 0xbf01285ce61c332e151a33e48d178d9c77a5c58c3f706527c40d131897bc5e4f .othentic/othentic-avs-register-as-operator.json 0x02c13D68F7194F9741DBfDdC65e6a58979A9dfcd https://holesky.gateway.tenderly.co
```

Output will be stored in `.othentic/othentic-evm-transaction-data.json`.


## Working with Different Wallet Types

### Standard EOA Wallets

For standard Externally Owned Accounts, simply use your EOA address as the `WALLET_ADDRESS` in all steps.

### Smart Account Wallets 

1. Generate the BLS signature using your smart wallet address
2. For registration transaction, you'll need to use the EIP-1271 compatible signing method
3. Submit the transaction data through your smart wallet interface

### Multisignature Wallets (e.g., Safe)

1. Generate the BLS signature 
2. Generate the registration transaction data
3. Use the multisig interface to create a new transaction with the data from `.othentic/othentic-evm-transaction-data.json`
4. Have the required signers approve the transaction

### Programmatic Usage

The generated JSON files can be used with any wallet software or solution that allows custom transaction data:

1. Extract the `to` and `data` fields from `.othentic/othentic-evm-transaction-data.json`
2. Create a transaction with these values in your wallet software
3. Set appropriate gas parameters and submit the transaction


## File Outputs

All scripts generate JSON files in the `.othentic` directory:

- `othentic-avs-register-as-operator.json`: BLS keys and registration signature
- `othentic-evm-transaction-data.json`: Transaction payload for registration
- `othentic-allowlist-request-signature.json`: Signature for allowlist service

## Troubleshooting

- **Invalid Signature**: Ensure your private keys are correct and wallet addresses match
- **Transaction Failure**: Verify chain ID is correct and RPC is functioning
- **Allowlist Rejection**: Check that your wallet address is eligible for allowlisting

## Security Considerations

- Never share your private keys
- Generate BLS keys in a secure environment
- Verify transaction data before signing, especially with multisigs
- Double-check all addresses to avoid registration errors
