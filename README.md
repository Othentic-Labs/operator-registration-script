# Othentic EIP-1271 Operator Registration Script


### Prerequisites
- Node 22.6 (preferably via NVM)
- OpenSSL

```
npm i
```


## Scripts

Scripts list:

- Generate Avs Bls Public Key & Auth Signature

- Generate Register as [Allowed] Operator

- Validate The Signature for Allowlist Service

- Generate Signature for Allowlist Service


### Generate Avs Bls Public Key & Auth Signature

This script generates auth signature for registering `<SMART_WALLET_ADDRESS>` as operator's address in AVS with the address `<AVS_GOVERNANCE_ADDRESS>`, using the private BLS key `<BLS_PRIVATE_KEY>`

```
ts-node scripts/genAvsRegisterBlsSignature.ts <BLS_PRIVATE_KEY> <AVS_GOVERNANCE_ADDRESS> <SMART_WALLET_ADDRESS> <RPC>
```

for example:

```
ts-node scripts/genAvsRegisterBlsSignature.ts 0x1aa4829bdf0461d6fc1d9cfb0de78eec4b142fc722112fd0369c407d03ad3adb 0x8B8136fB6A8ea7AbA61d88da5753D8fEa2d7d5b2 0x02c13D68F7194F9741DBfDdC65e6a58979A9dfcd https://holesky.gateway.tenderly.co
```

outputs:
```

Generating signature for operator registration...



operator: 0x02c13D68F7194F9741DBfDdC65e6a58979A9dfcd (smart wallet eip-1271)
AVS: 0x8B8136fB6A8ea7AbA61d88da5753D8fEa2d7d5b2
chain: 17000



blsKey: 
0x12f0b147ce5f9bbc855767b4b9806b9e905e939d5853b39b9ea42b74896667e818369b7c44716557c6bc5fa4ce665554c640114beb1d448236f7cf8a31f57349,0x30371e56c2af8022ad4f3475095aefdc15d27b7f50243a6d9d09790cf40660c91b481b478fa69a7ab0ff9bdfcbb568eae8a9b6cd1009b04f68e85edaf1c31eea

blsRegistrationSignature: 
0x2fc6410f5bd9f05dbe20ebea167ee00632fb7b973cad837492f3e0ccbc34df80040455a71e8e013cfb7001cc9f69dbee26d5daaf824994904361d5aa5242374f


json file stored:
/Users/dev/projects/.othentic/othentic-avs-register-as-operator.json

```

Once done a formatted json file with the results will be ready to be shared:

```
cat .othentic/othentic-avs-register-as-operator.json
```

outputs:

```
{
  "format": "othentic-avs-register-as-operator",
  "version": "1.0.0",
  "operator": "0x02c13D68F7194F9741DBfDdC65e6a58979A9dfcd",
  "chainId": "17000",
  "avs": "0x8B8136fB6A8ea7AbA61d88da5753D8fEa2d7d5b2",
  "blsKey": [
    "0x18369b7c44716557c6bc5fa4ce665554c640114beb1d448236f7cf8a31f57349",
    "0x12f0b147ce5f9bbc855767b4b9806b9e905e939d5853b39b9ea42b74896667e8",
    "0x1b481b478fa69a7ab0ff9bdfcbb568eae8a9b6cd1009b04f68e85edaf1c31eea",
    "0x30371e56c2af8022ad4f3475095aefdc15d27b7f50243a6d9d09790cf40660c9"
  ],
  "blsRegistrationSignature": [
    "0x2fc6410f5bd9f05dbe20ebea167ee00632fb7b973cad837492f3e0ccbc34df80",
    "0x040455a71e8e013cfb7001cc9f69dbee26d5daaf824994904361d5aa5242374f"
  ]
}
```


### Generate Register as [Allowed] Operator

This script gets the json resulted from the previous script `<JSON_FILE>` and use it together with `<ECDSA_PRIVATE_KEY>`, `<RECEIVER_ADDRESS>`, optional `<AUTH_TOKEN>` and `<RPC>`


```
ts-node scripts/genRegisterAsOperatorTx.ts <ECDSA_PRIVATE_KEY> <JSON_FILE> <RECEIVER_ADDRESS> <AUTH_TOKEN> <RPC>
```

for example:

```
ts-node scripts/genRegisterAsOperatorTx.ts 0xbf01285ce61c332e151a33e48d178d9c77a5c58c3f706527c40d131897bc5e4f .othentic/othentic-avs-register-as-operator.json 0x02c13D68F7194F9741DBfDdC65e6a58979A9dfcd XXX https://holesky.gateway.tenderly.co
```

outputs:
```

Generating register as allowed operator transaction



operator: 0x02c13D68F7194F9741DBfDdC65e6a58979A9dfcd
AVS: 0x8B8136fB6A8ea7AbA61d88da5753D8fEa2d7d5b2
chainId: 17000
AVS Directory: 0x055733000064333CaDDbC92763c58BF0192fFeBf



eigenDigestSignature:

        signature: 0xa05e51eb7b0d580f28ed00c45fa03b89bc5cb6cfbd4566e82ca380c59554a4c608f25c4895b892052258877f163cf577e43e3c4be66ea79127877aa02d8d58471b
        salt: 0x302e323830303834343034303331343238373600000000000000000000000000
        expiry: 115792089237316195423570985008687907853269984665640564039457584007913129639935



Register on AVS tx to be sent:

        to: 0x055733000064333CaDDbC92763c58BF0192fFeBf
        data: 0x22609a4d18369b7c44716557c6bc5fa4ce665554c640114beb1d448236f7cf8a31f5734912f0b147ce5f9bbc855767b4b9806b9e905e939d5853b39b9ea42b74896667e81b481b478fa69a7ab0ff9bdfcbb568eae8a9b6cd1009b04f68e85edaf1c31eea30371e56c2af8022ad4f3475095aefdc15d27b7f50243a6d9d09790cf40660c900000000000000000000000002c13d68f7194f9741dbfddc65e6a58979a9dfcd00000000000000000000000000000000000000000000000000000000000001002fc6410f5bd9f05dbe20ebea167ee00632fb7b973cad837492f3e0ccbc34df80040455a71e8e013cfb7001cc9f69dbee26d5daaf824994904361d5aa5242374f0000000000000000000000000000000000000000000000000000000000000060302e323830303834343034303331343238373600000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000041a05e51eb7b0d580f28ed00c45fa03b89bc5cb6cfbd4566e82ca380c59554a4c608f25c4895b892052258877f163cf577e43e3c4be66ea79127877aa02d8d58471b00000000000000000000000000000000000000000000000000000000000000




json file stored: 
/Users/dev/projects/.othentic/othentic-evm-transaction-data.json


```
Once done a formatted json file with the desired evm transaction data will be stored

```
cat .othentic/othentic-evm-transaction-data.json
```

outputs:

```
{
  "format": "othentic-evm-transaction-data",
  "version": "1.0.0",
  "to": "0x055733000064333CaDDbC92763c58BF0192fFeBf",
  "data": "0x22609a4d18369b7c44716557c6bc5fa4ce665554c640114beb1d448236f7cf8a31f5734912f0b147ce5f9bbc855767b4b9806b9e905e939d5853b39b9ea42b74896667e81b481b478fa69a7ab0ff9bdfcbb568eae8a9b6cd1009b04f68e85edaf1c31eea30371e56c2af8022ad4f3475095aefdc15d27b7f50243a6d9d09790cf40660c900000000000000000000000002c13d68f7194f9741dbfddc65e6a58979a9dfcd00000000000000000000000000000000000000000000000000000000000001002fc6410f5bd9f05dbe20ebea167ee00632fb7b973cad837492f3e0ccbc34df80040455a71e8e013cfb7001cc9f69dbee26d5daaf824994904361d5aa5242374f0000000000000000000000000000000000000000000000000000000000000060302e323830303834343034303331343238373600000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000041a05e51eb7b0d580f28ed00c45fa03b89bc5cb6cfbd4566e82ca380c59554a4c608f25c4895b892052258877f163cf577e43e3c4be66ea79127877aa02d8d58471b00000000000000000000000000000000000000000000000000000000000000"
}
```

### Generate Signature for Allowlist Service

This script generates auth signature for the auth token that is generated in allowlist service. `<SIGNER_PRIVATE_KEY>` is the Smart Wallet singing EOA key, `<WALLET>` is the Smart Contract address and  `<AVS_GOVERNANCE_ADDRESS>` is the AvsGovernance address

```
ts-node scripts/allowlist/generateSignature.ts <SIGNER_PRIVATE_KEY> <WALLET> <AVS_GOVERNANCE>
```

for example:

```
ts-node scripts/allowlist/generateSignature.ts 6212d241a920a6d5d9841af933411d8d6141638c8f7d21a6b32594014ef0006e 0x7F2a575015946D06284E130b00944c5755c351f2 0x02c13D68F7194F9741DBfDdC65e6a58979A9dfcd
```

outputs:
```

Signer address: 0x271C1667aE932E08D77e8B339568022f20a77Cc0
Smart wallet address: 0x7F2a575015946D06284E130b00944c5755c351f2
Avs address: 0x02c13D68F7194F9741DBfDdC65e6a58979A9dfcd


payloadHash: 
0x35a64ba173224117611ac29547d437acd016bcf7bdcea806e4673ef1ee63bd0b

signature: 
0xb2477291c0cf813862954a5d1d9e628bf3b4f1da97a4dc71a604a7abf9ec92091ec9f99d15a937d9e2a469f9ab7107565c78becd9058e5cb8a04aac4674c1d4f1c


json file stored: 
/Users/dev/projects/.othentic/othentic-allowlist-request-signature.json

```

Once done a formatted json file with the results can be use as `POST` body for allowlist service

```
cat .othentic/othentic-allowlist-request-signature.json
```

outputs:

```
{
  "format": "othentic-allowlist-request-signature",
  "version": "1.0.0",
  "wallet": "0x7F2a575015946D06284E130b00944c5755c351f2",
  "avsGovernanceAddress": "0x02c13D68F7194F9741DBfDdC65e6a58979A9dfcd",
  "signature": "0xb2477291c0cf813862954a5d1d9e628bf3b4f1da97a4dc71a604a7abf9ec92091ec9f99d15a937d9e2a469f9ab7107565c78becd9058e5cb8a04aac4674c1d4f1c",
  "isSmartWallet": true
}
```


### Validate The Signature for Allowlist Service

This script gets the json resulted from the previous script `<JSON_FILE>` and use it together with `<RPC>` to resolve if the signature is validated by the Smart Contract or not.


```
ts-node scripts/allowlist/validateSignature.ts <JSON_FILE> <RPC>
```

for example:

```
ts-node scripts/allowlist/validateSignature.ts .othentic/othentic-allowlist-request-signature.json https://holesky.gateway.tenderly.co
```

outputs:
```

Smart Wallet Signature Validation...


from json file: .othentic/othentic-allowlist-request-signature.json

Smart wallet address: 0x7F2a575015946D06284E130b00944c5755c351f2
AvsGovernance address: 0x02c13D68F7194F9741DBfDdC65e6a58979A9dfcd
Signature: 0xb2477291c0cf813862954a5d1d9e628bf3b4f1da97a4dc71a604a7abf9ec92091ec9f99d15a937d9e2a469f9ab7107565c78becd9058e5cb8a04aac4674c1d4f1c


is valid: 
true


```
