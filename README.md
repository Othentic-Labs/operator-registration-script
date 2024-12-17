# Othentic EIP-1271 Operator Registration Script


### Prerequisites
- Node 22.6 (preferably via NVM)
- OpenSSL

```
npm i
```


## Scripts

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
/Users/dev/projects/.othentic/avs-register-as-operator.json

```

Once done a formatted json file with the results will be ready to be shared:

```
cat .othentic/avs-register-as-operator.json
```

outputs:

```
{
  "format": "avs-register-as-operator.json",
  "version": "1.0.0",
  "operator": "0x02c13D68F7194F9741DBfDdC65e6a58979A9dfcd",
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