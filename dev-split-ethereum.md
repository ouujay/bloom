# MamaAlert Development Guide (Ethereum/Base Version)

**Project:** MamaAlert - Maternal Health Incentive Platform  
**Version:** 2.0 (Updated for Ethereum/Base)
**Last Updated:** December 2024

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Team Structure](#team-structure)
3. [Developer A: Blockchain & Financial Flows](#developer-a-blockchain--financial-flows)
4. [Developer B: Frontend & Core App](#developer-b-frontend--core-app)
5. [API Contracts](#api-contracts)
6. [Database Schema](#database-schema)
7. [Development Timeline](#development-timeline)
8. [Coordination Guidelines](#coordination-guidelines)

---

## Project Overview

MamaAlert incentivizes pregnant women to complete healthy actions by rewarding them with blockchain-based tokens (BLOOM). Mothers earn tokens for activities like attending checkups, then redeem them for cash via admin-approved withdrawals.

**Key Technical Decisions:**

- **Blockchain:** Base (Sepolia testnet for hackathon)
- **Token:** BLOOM (ERC20 token, 1 BLOOM = ₦2)
- **Smart Contract:** Solidity + Hardhat
- **Backend:** Django REST API + Web3.py
- **Frontend:** React/Next.js
- **Withdrawals:** Manual admin approval (no automatic payouts)

**Why Base/Ethereum?**
- Simple transaction signing (one method call)
- Clean transaction hashes for transparency
- Better Claude Code support (95% vs 40%)
- Faster development (6 hours vs 16+ hours)
- More readable blockchain explorer for donors

---

## Team Structure

| Role | Focus Area | Key Deliverables |
|------|------------|------------------|
| **Developer A** | Blockchain, Donations, Withdrawals | Smart contract, webhooks, admin approval system |
| **Developer B** | Frontend, UI/UX, Health Features | Mother app, admin dashboard, donor dashboard |

---

## Developer A: Blockchain & Financial Flows

### Responsibilities

Developer A owns all blockchain integration and financial transaction logic:

1. Ethereum smart contract development and deployment (Solidity)
2. Donation recording on blockchain via payment webhooks
3. Token minting when mothers complete actions
4. Admin withdrawal approval system
5. Blockchain recording after admin disburses funds

---

## Setup Tasks (Developer A)

### Environment Setup (2 hours max)

**Install Node.js and Hardhat:**

```bash
# Check Node.js version (need 16+)
node --version

# Create project directory
mkdir mamalert-blockchain
cd mamalert-blockchain

# Initialize npm project
npm init -y

# Install Hardhat
npm install --save-dev hardhat

# Initialize Hardhat project
npx hardhat init
# Select: "Create a JavaScript project"

# Install required dependencies
npm install --save-dev @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
npm install dotenv

# Install Web3.py for Django integration
pip install web3 python-dotenv
```

---

### Create Admin Wallet

```bash
# Generate new wallet
npx hardhat console

# In console, run:
const wallet = ethers.Wallet.createRandom()
console.log("Address:", wallet.address)
console.log("Private Key:", wallet.privateKey)

# Save private key to .env file
echo "ADMIN_PRIVATE_KEY=0xYourPrivateKeyHere" >> .env
echo "BASE_RPC_URL=https://sepolia.base.org" >> .env
```

**Get Testnet ETH:**
1. Go to https://www.alchemy.com/faucets/base-sepolia
2. Enter your admin wallet address
3. Request testnet ETH (for gas fees)

---

## Smart Contract Development

### File Structure

```
mamalert-blockchain/
├── contracts/
│   └── BloomToken.sol          # Your smart contract
├── scripts/
│   └── deploy.js               # Deployment script
├── test/
│   └── BloomToken.test.js      # Tests (optional)
├── hardhat.config.js           # Hardhat configuration
├── .env                        # Private keys (DO NOT COMMIT)
└── package.json
```

---

### BloomToken.sol - Complete Smart Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BloomToken
 * @dev ERC20 Token for MamaAlert maternal health incentive platform
 * 1 BLOOM = ₦2
 */
contract BloomToken is ERC20, Ownable {
    
    // Events for tracking all actions
    event DonationRecorded(
        uint256 amount,
        string reference,
        string donorEmail,
        uint256 timestamp
    );
    
    event TokensMinted(
        address indexed recipient,
        uint256 amount,
        string actionType,
        string actionId,
        uint256 timestamp
    );
    
    event TokensBurned(
        address indexed from,
        uint256 amount,
        string withdrawalId,
        uint256 timestamp
    );
    
    event WithdrawalCompleted(
        address indexed user,
        uint256 tokenAmount,
        uint256 nairaAmount,
        string withdrawalId,
        string paymentReference,
        uint256 timestamp
    );
    
    // Constructor
    constructor() ERC20("Bloom", "BLOOM") Ownable(msg.sender) {
        // No initial supply - tokens minted on-demand
    }
    
    /**
     * @dev Record a donation on-chain (no token minting, just logging)
     * Called when Paystack webhook confirms payment
     */
    function recordDonation(
        uint256 amountNaira,
        string memory reference,
        string memory donorEmail
    ) public onlyOwner {
        emit DonationRecorded(
            amountNaira,
            reference,
            donorEmail,
            block.timestamp
        );
    }
    
    /**
     * @dev Mint tokens to a mother when she completes a healthy action
     * Called by backend after validating the action
     */
    function mintTokens(
        address recipient,
        uint256 amount,
        string memory actionType,
        string memory actionId
    ) public onlyOwner {
        require(recipient != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        
        _mint(recipient, amount);
        
        emit TokensMinted(
            recipient,
            amount,
            actionType,
            actionId,
            block.timestamp
        );
    }
    
    /**
     * @dev Burn tokens when withdrawal is approved
     * Called by backend after admin approves and pays the mother
     */
    function burnTokens(
        address from,
        uint256 amount,
        string memory withdrawalId
    ) public onlyOwner {
        require(from != address(0), "Cannot burn from zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(from) >= amount, "Insufficient balance to burn");
        
        _burn(from, amount);
        
        emit TokensBurned(
            from,
            amount,
            withdrawalId,
            block.timestamp
        );
    }
    
    /**
     * @dev Record completed withdrawal on-chain
     * Called after admin has paid the mother via OPay/Alat
     */
    function recordWithdrawal(
        address user,
        uint256 tokenAmount,
        uint256 nairaAmount,
        string memory withdrawalId,
        string memory paymentReference
    ) public onlyOwner {
        emit WithdrawalCompleted(
            user,
            tokenAmount,
            nairaAmount,
            withdrawalId,
            paymentReference,
            block.timestamp
        );
    }
    
    /**
     * @dev Get total supply of BLOOM tokens
     */
    function getTotalSupply() public view returns (uint256) {
        return totalSupply();
    }
}
```

---

### hardhat.config.js - Configuration

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    baseSepolia: {
      url: process.env.BASE_RPC_URL || "https://sepolia.base.org",
      accounts: process.env.ADMIN_PRIVATE_KEY ? [process.env.ADMIN_PRIVATE_KEY] : [],
      chainId: 84532
    }
  },
  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY || ""
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  }
};
```

---

### deploy.js - Deployment Script

```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying BloomToken to Base Sepolia...");
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");
  
  // Deploy contract
  const BloomToken = await hre.ethers.getContractFactory("BloomToken");
  const bloomToken = await BloomToken.deploy();
  
  await bloomToken.waitForDeployment();
  
  const address = await bloomToken.getAddress();
  console.log("BloomToken deployed to:", address);
  console.log("Save this address in your .env file as CONTRACT_ADDRESS");
  console.log("\nExplorer URL:", `https://sepolia.basescan.org/address/${address}`);
  
  // Verify on Basescan (optional but recommended)
  console.log("\nWaiting 30 seconds before verification...");
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
    console.log("Contract verified on Basescan!");
  } catch (error) {
    console.log("Verification failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

---

### Deploy the Contract

```bash
# Compile contract
npx hardhat compile

# Deploy to Base Sepolia testnet
npx hardhat run scripts/deploy.js --network baseSepolia

# You'll see output like:
# BloomToken deployed to: 0x1234567890abcdef...
# Save this address!

# Add to .env file
echo "CONTRACT_ADDRESS=0xYourContractAddressHere" >> .env
```

---

## Django Backend Integration

### Install Web3.py

```bash
pip install web3 python-dotenv
```

---

### blockchain.py - Web3 Integration Module

Create `mamalert/blockchain.py`:

```python
"""
Blockchain integration module for MamaAlert
Handles all interactions with BloomToken smart contract on Base
"""

import os
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv
import json

load_dotenv()

# Configuration
BASE_RPC_URL = os.getenv('BASE_RPC_URL', 'https://sepolia.base.org')
ADMIN_PRIVATE_KEY = os.getenv('ADMIN_PRIVATE_KEY')
CONTRACT_ADDRESS = os.getenv('CONTRACT_ADDRESS')

# Connect to Base
w3 = Web3(Web3.HTTPProvider(BASE_RPC_URL))

# Load admin account
admin_account = Account.from_key(ADMIN_PRIVATE_KEY)

# Contract ABI (paste from artifacts/contracts/BloomToken.sol/BloomToken.json)
CONTRACT_ABI = json.loads('''
[
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "allowance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "needed",
        "type": "uint256"
      }
    ],
    "name": "ERC20InsufficientAllowance",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "balance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "needed",
        "type": "uint256"
      }
    ],
    "name": "ERC20InsufficientBalance",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "approver",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidApprover",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidReceiver",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidSender",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidSpender",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "reference",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "donorEmail",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "DonationRecorded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "withdrawalId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "TokensBurned",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "actionType",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "actionId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "TokensMinted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "tokenAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "nairaAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "withdrawalId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "paymentReference",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "WithdrawalCompleted",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "withdrawalId",
        "type": "string"
      }
    ],
    "name": "burnTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "actionType",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "actionId",
        "type": "string"
      }
    ],
    "name": "mintTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amountNaira",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "reference",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "donorEmail",
        "type": "string"
      }
    ],
    "name": "recordDonation",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "nairaAmount",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "withdrawalId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "paymentReference",
        "type": "string"
      }
    ],
    "name": "recordWithdrawal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
''')

# Initialize contract
contract = w3.eth.contract(
    address=Web3.to_checksum_address(CONTRACT_ADDRESS),
    abi=CONTRACT_ABI
)


def record_deposit(amount_naira, reference, donor_email):
    """
    Record donation on blockchain when Paystack webhook confirms payment
    
    Args:
        amount_naira (float): Amount donated in Naira
        reference (str): Paystack payment reference
        donor_email (str): Donor's email address
    
    Returns:
        dict: Transaction details including hash and explorer URL
    """
    try:
        # Build transaction
        tx = contract.functions.recordDonation(
            int(amount_naira),
            reference,
            donor_email
        ).build_transaction({
            'from': admin_account.address,
            'nonce': w3.eth.get_transaction_count(admin_account.address),
            'gas': 200000,
            'gasPrice': w3.eth.gas_price,
        })
        
        # Sign transaction
        signed_tx = admin_account.sign_transaction(tx)
        
        # Send transaction
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        # Wait for confirmation
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        tx_hash_hex = tx_hash.hex()
        
        return {
            'success': True,
            'signature': tx_hash_hex,
            'explorer_url': f'https://sepolia.basescan.org/tx/{tx_hash_hex}',
            'block_number': receipt['blockNumber'],
            'gas_used': receipt['gasUsed']
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def mint_tokens(user_wallet, amount, action_type, action_id):
    """
    Mint BLOOM tokens to a mother when she completes a healthy action
    
    Args:
        user_wallet (str): Mother's Ethereum wallet address
        amount (int): Number of tokens to mint
        action_type (str): Type of action (checkup, module, etc.)
        action_id (str): Unique identifier for the action
    
    Returns:
        dict: Transaction details including hash and explorer URL
    """
    try:
        # Validate address
        user_wallet = Web3.to_checksum_address(user_wallet)
        
        # Build transaction
        tx = contract.functions.mintTokens(
            user_wallet,
            int(amount),
            action_type,
            action_id
        ).build_transaction({
            'from': admin_account.address,
            'nonce': w3.eth.get_transaction_count(admin_account.address),
            'gas': 200000,
            'gasPrice': w3.eth.gas_price,
        })
        
        # Sign transaction
        signed_tx = admin_account.sign_transaction(tx)
        
        # Send transaction
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        # Wait for confirmation (2-5 seconds on Base)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        tx_hash_hex = tx_hash.hex()
        
        return {
            'success': True,
            'signature': tx_hash_hex,
            'explorer_url': f'https://sepolia.basescan.org/tx/{tx_hash_hex}',
            'block_number': receipt['blockNumber'],
            'gas_used': receipt['gasUsed']
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def burn_tokens(user_wallet, amount, withdrawal_id):
    """
    Burn tokens when admin approves withdrawal
    
    Args:
        user_wallet (str): Mother's Ethereum wallet address
        amount (int): Number of tokens to burn
        withdrawal_id (str): Unique identifier for the withdrawal request
    
    Returns:
        dict: Transaction details including hash and explorer URL
    """
    try:
        # Validate address
        user_wallet = Web3.to_checksum_address(user_wallet)
        
        # Build transaction
        tx = contract.functions.burnTokens(
            user_wallet,
            int(amount),
            withdrawal_id
        ).build_transaction({
            'from': admin_account.address,
            'nonce': w3.eth.get_transaction_count(admin_account.address),
            'gas': 200000,
            'gasPrice': w3.eth.gas_price,
        })
        
        # Sign transaction
        signed_tx = admin_account.sign_transaction(tx)
        
        # Send transaction
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        # Wait for confirmation
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        tx_hash_hex = tx_hash.hex()
        
        return {
            'success': True,
            'signature': tx_hash_hex,
            'explorer_url': f'https://sepolia.basescan.org/tx/{tx_hash_hex}',
            'block_number': receipt['blockNumber'],
            'gas_used': receipt['gasUsed']
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def record_withdrawal(user_wallet, token_amount, naira_amount, withdrawal_id, payment_reference):
    """
    Record completed withdrawal on blockchain after admin has paid
    
    Args:
        user_wallet (str): Mother's Ethereum wallet address
        token_amount (int): Number of tokens withdrawn
        naira_amount (float): Naira amount paid
        withdrawal_id (str): Unique identifier for the withdrawal
        payment_reference (str): Payment reference from OPay/Alat
    
    Returns:
        dict: Transaction details including hash and explorer URL
    """
    try:
        # Validate address
        user_wallet = Web3.to_checksum_address(user_wallet)
        
        # Build transaction
        tx = contract.functions.recordWithdrawal(
            user_wallet,
            int(token_amount),
            int(naira_amount),
            withdrawal_id,
            payment_reference
        ).build_transaction({
            'from': admin_account.address,
            'nonce': w3.eth.get_transaction_count(admin_account.address),
            'gas': 250000,
            'gasPrice': w3.eth.gas_price,
        })
        
        # Sign transaction
        signed_tx = admin_account.sign_transaction(tx)
        
        # Send transaction
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        # Wait for confirmation
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        tx_hash_hex = tx_hash.hex()
        
        return {
            'success': True,
            'signature': tx_hash_hex,
            'explorer_url': f'https://sepolia.basescan.org/tx/{tx_hash_hex}',
            'block_number': receipt['blockNumber'],
            'gas_used': receipt['gasUsed']
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def get_balance(user_wallet):
    """
    Get a user's BLOOM token balance from blockchain
    
    Args:
        user_wallet (str): User's Ethereum wallet address
    
    Returns:
        int: Token balance
    """
    try:
        user_wallet = Web3.to_checksum_address(user_wallet)
        balance = contract.functions.balanceOf(user_wallet).call()
        return balance
    except Exception as e:
        print(f"Error getting balance: {e}")
        return 0


def get_total_supply():
    """
    Get total supply of BLOOM tokens
    
    Returns:
        int: Total supply of tokens
    """
    try:
        return contract.functions.getTotalSupply().call()
    except Exception as e:
        print(f"Error getting total supply: {e}")
        return 0
```

---

### Django Views - Using blockchain.py

Update your Django views to use the blockchain module:

```python
# views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import JsonResponse, HttpResponse
import json
import hmac
import hashlib
from . import blockchain
from .models import User, TokenTransaction, Donation, WithdrawalRequest


@api_view(['POST'])
def paystack_webhook(request):
    """
    Webhook endpoint for Paystack payment confirmations
    Records donations on blockchain
    """
    # Verify webhook signature
    signature = request.headers.get('x-paystack-signature')
    computed = hmac.new(
        settings.PAYSTACK_SECRET.encode(),
        request.body,
        hashlib.sha512
    ).hexdigest()
    
    if signature != computed:
        return HttpResponse(status=400)
    
    data = json.loads(request.body)
    
    if data['event'] == 'charge.success':
        amount = data['data']['amount'] / 100  # Convert from kobo
        reference = data['data']['reference']
        donor_email = data['data']['customer']['email']
        
        # Record on blockchain
        tx_result = blockchain.record_deposit(
            amount_naira=amount,
            reference=reference,
            donor_email=donor_email
        )
        
        if tx_result['success']:
            # Save to database
            Donation.objects.create(
                amount=amount,
                reference=reference,
                donor_email=donor_email,
                blockchain_tx=tx_result['signature'],
                explorer_url=tx_result['explorer_url']
            )
        else:
            # Log error but don't fail webhook
            print(f"Blockchain error: {tx_result['error']}")
    
    return HttpResponse(status=200)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mint_tokens(request):
    """
    Mint tokens to a mother when she completes a healthy action
    """
    user = request.user
    action_type = request.data.get('action_type')
    action_id = request.data.get('action_id')
    
    # Reward amounts
    rewards = {
        'signup': 50,
        'profile_complete': 50,
        'checkup': 200,
        'module': 50,
        'daily_log': 10,
        'referral': 150,
        'postpartum_checkup': 200
    }
    
    amount = rewards.get(action_type, 0)
    
    if amount == 0:
        return Response({
            'success': False,
            'error': 'Invalid action type'
        }, status=400)
    
    # Mint on blockchain
    tx_result = blockchain.mint_tokens(
        user_wallet=user.wallet_address,
        amount=amount,
        action_type=action_type,
        action_id=action_id
    )
    
    if not tx_result['success']:
        return Response({
            'success': False,
            'error': tx_result['error']
        }, status=500)
    
    # Update cached balance
    user.token_balance += amount
    user.save()
    
    # Log transaction
    TokenTransaction.objects.create(
        user=user,
        amount=amount,
        tx_type='mint',
        action_type=action_type,
        blockchain_tx=tx_result['signature'],
        explorer_url=tx_result['explorer_url']
    )
    
    return Response({
        'success': True,
        'tokens_earned': amount,
        'new_balance': user.token_balance,
        'explorer_url': tx_result['explorer_url']
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_withdrawal(request):
    """
    Create withdrawal request (no blockchain yet - admin approves first)
    """
    user = request.user
    amount = request.data.get('amount')
    destination = request.data.get('mobile_money')
    provider = request.data.get('provider')
    
    # Validate
    if user.token_balance < amount:
        return Response({
            'success': False,
            'error': 'Insufficient balance'
        }, status=400)
    
    if amount < 500:
        return Response({
            'success': False,
            'error': 'Minimum withdrawal is 500 tokens (₦1,000)'
        }, status=400)
    
    # Create pending request
    withdrawal = WithdrawalRequest.objects.create(
        user=user,
        token_amount=amount,
        naira_amount=amount * 2,  # 1 BLOOM = ₦2
        destination=destination,
        provider=provider,
        status='pending'
    )
    
    # Freeze tokens
    user.available_balance -= amount
    user.save()
    
    return Response({
        'success': True,
        'message': 'Request submitted, awaiting approval',
        'request_id': withdrawal.id
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_withdrawal(request, withdrawal_id):
    """
    Admin approves withdrawal and records on blockchain
    (Admin must have already paid via OPay/Alat)
    """
    if not request.user.is_admin:
        return Response({'error': 'Unauthorized'}, status=403)
    
    payment_reference = request.data.get('payment_reference')
    
    if not payment_reference:
        return Response({
            'success': False,
            'error': 'Payment reference required'
        }, status=400)
    
    withdrawal = WithdrawalRequest.objects.get(id=withdrawal_id)
    
    if withdrawal.status != 'pending':
        return Response({
            'success': False,
            'error': 'Withdrawal already processed'
        }, status=400)
    
    # Burn tokens on blockchain
    burn_result = blockchain.burn_tokens(
        user_wallet=withdrawal.user.wallet_address,
        amount=withdrawal.token_amount,
        withdrawal_id=str(withdrawal.id)
    )
    
    if not burn_result['success']:
        return Response({
            'success': False,
            'error': f"Burn failed: {burn_result['error']}"
        }, status=500)
    
    # Record withdrawal completion
    record_result = blockchain.record_withdrawal(
        user_wallet=withdrawal.user.wallet_address,
        token_amount=withdrawal.token_amount,
        naira_amount=withdrawal.naira_amount,
        withdrawal_id=str(withdrawal.id),
        payment_reference=payment_reference
    )
    
    if not record_result['success']:
        return Response({
            'success': False,
            'error': f"Record failed: {record_result['error']}"
        }, status=500)
    
    # Update withdrawal
    withdrawal.status = 'completed'
    withdrawal.payment_reference = payment_reference
    withdrawal.blockchain_tx = record_result['signature']
    withdrawal.explorer_url = record_result['explorer_url']
    withdrawal.save()
    
    # Update user balance
    user = withdrawal.user
    user.token_balance -= withdrawal.token_amount
    user.save()
    
    return Response({
        'success': True,
        'message': 'Withdrawal approved and recorded',
        'explorer_url': record_result['explorer_url']
    })
```

---

## Testing Your Integration

### Test Script

Create `test_blockchain.py`:

```python
"""
Test script for blockchain integration
Run: python test_blockchain.py
"""

from blockchain import (
    record_deposit,
    mint_tokens,
    burn_tokens,
    record_withdrawal,
    get_balance,
    get_total_supply
)

# Test wallet (you can generate one for testing)
TEST_WALLET = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

print("=" * 50)
print("BLOOM TOKEN BLOCKCHAIN TESTS")
print("=" * 50)

# Test 1: Record Donation
print("\n1. Recording donation...")
result = record_deposit(
    amount_naira=10000,
    reference="TEST_REF_001",
    donor_email="donor@example.com"
)
print(f"Success: {result['success']}")
if result['success']:
    print(f"TX Hash: {result['signature']}")
    print(f"Explorer: {result['explorer_url']}")

# Test 2: Mint Tokens
print("\n2. Minting tokens...")
result = mint_tokens(
    user_wallet=TEST_WALLET,
    amount=200,
    action_type="checkup",
    action_id="TEST_ACTION_001"
)
print(f"Success: {result['success']}")
if result['success']:
    print(f"TX Hash: {result['signature']}")
    print(f"Explorer: {result['explorer_url']}")

# Test 3: Check Balance
print("\n3. Checking balance...")
balance = get_balance(TEST_WALLET)
print(f"Balance: {balance} BLOOM")

# Test 4: Burn Tokens
print("\n4. Burning tokens...")
result = burn_tokens(
    user_wallet=TEST_WALLET,
    amount=100,
    withdrawal_id="TEST_WITHDRAWAL_001"
)
print(f"Success: {result['success']}")
if result['success']:
    print(f"TX Hash: {result['signature']}")

# Test 5: Record Withdrawal
print("\n5. Recording withdrawal...")
result = record_withdrawal(
    user_wallet=TEST_WALLET,
    token_amount=100,
    naira_amount=200,
    withdrawal_id="TEST_WITHDRAWAL_001",
    payment_reference="OPAY12345"
)
print(f"Success: {result['success']}")
if result['success']:
    print(f"TX Hash: {result['signature']}")

# Test 6: Total Supply
print("\n6. Checking total supply...")
supply = get_total_supply()
print(f"Total Supply: {supply} BLOOM")

print("\n" + "=" * 50)
print("TESTS COMPLETE")
print("=" * 50)
```

Run tests:
```bash
python test_blockchain.py
```

---

## Development Timeline (Developer A)

| Time | Task | Status |
|------|------|--------|
| **Hour 0-2** | Environment setup, install Hardhat | ⏳ |
| **Hour 2-3** | Write BloomToken.sol contract | ⏳ |
| **Hour 3-4** | Deploy contract to Base Sepolia | ⏳ |
| **Hour 4-5** | Create blockchain.py integration module | ⏳ |
| **Hour 5-6** | Test all blockchain functions | ⏳ |
| **Hour 6-8** | Implement Django endpoints | ⏳ |
| **Hour 8-9** | Integration testing with Dev B | ⏳ |
| **Hour 9-10** | Bug fixes and documentation | ⏳ |

**Total: 10 hours for complete blockchain layer**

---

## Coordination with Developer B

### What Developer B Needs From You:

1. **Contract Address**
   ```
   CONTRACT_ADDRESS=0xYourDeployedContractAddress
   ```

2. **API Endpoints** (you'll build these)
   - `POST /api/webhooks/paystack/` - Donation webhook
   - `POST /api/tokens/mint/` - Mint tokens
   - `POST /api/withdrawals/request/` - Request withdrawal
   - `POST /api/admin/withdrawals/{id}/approve/` - Approve withdrawal
   - `GET /api/tokens/balance/` - Get balance
   - `GET /api/tokens/transactions/` - Get transaction history

3. **Explorer URL Format**
   ```
   https://sepolia.basescan.org/tx/{transaction_hash}
   ```

### What You Need From Developer B:

1. **User Model** with these fields:
   - `wallet_address` (Ethereum address)
   - `token_balance` (integer)
   - `available_balance` (integer)

2. **Frontend calls your endpoints** when:
   - User completes action → `POST /api/tokens/mint/`
   - User requests withdrawal → `POST /api/withdrawals/request/`
   - Admin approves withdrawal → `POST /api/admin/withdrawals/{id}/approve/`

---

## Environment Variables

Create `.env` file in your Django project:

```bash
# Ethereum/Base Configuration
BASE_RPC_URL=https://sepolia.base.org
ADMIN_PRIVATE_KEY=0xYourPrivateKeyHere
CONTRACT_ADDRESS=0xYourDeployedContractAddress

# Paystack
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...

# Django
SECRET_KEY=your-django-secret-key
DEBUG=True
```

**⚠️ NEVER COMMIT .env TO GIT**

Add to `.gitignore`:
```
.env
*.pyc
__pycache__/
node_modules/
```

---

## Summary for Developer A

**Your Responsibilities:**
1. ✅ Set up Hardhat project (2 hours)
2. ✅ Write and deploy BloomToken smart contract (2 hours)
3. ✅ Create blockchain.py integration module (2 hours)
4. ✅ Build Django API endpoints (3 hours)
5. ✅ Test all flows (1 hour)

**Total Time: ~10 hours**

**With Claude Code helping, this is very achievable in 1-2 days.**

**Key Advantages of Ethereum/Base:**
- ✅ Simple transaction signing (one function call)
- ✅ Clean transaction hashes for database storage
- ✅ Readable blockchain explorer for donors
- ✅ 95% Claude Code support (vs 40% with Rust/Solana)
- ✅ Faster development (10 hours vs 20+ hours)
- ✅ Same transparency and immutability as Solana

**The signature you store looks like:**
```
0x7f8a3d2c1b9e4f8a3d2c1b9e4f8a3d2c1b9e4f8a3d2c1b9e4f8a3d2c1b9e4f8a
```

**Donors click explorer URL and see:**
```
https://sepolia.basescan.org/tx/0x7f8a3d2c1b9e4f8a3d2c1b9e4f8a3d2c...

Transaction Details:
✓ Success
From: Admin Wallet
To: BloomToken Contract
Function: mintTokens
  - recipient: 0xMotherWallet
  - amount: 200
Gas Used: 45,231
```

**Perfect transparency. Easy to understand. Works beautifully.**

---

## Next Steps

1. **Read this document completely**
2. **Set up Hardhat environment** (follow Setup Tasks section)
3. **Deploy BloomToken contract** (copy code, run deploy script)
4. **Create blockchain.py** (copy entire module)
5. **Build Django endpoints** (copy views.py examples)
6. **Test everything** (run test_blockchain.py)
7. **Coordinate with Developer B** (share contract address and API endpoints)

**You've got this! With Claude Code and Ethereum, you'll have blockchain working in 10 hours.**

---

*End of Developer A Guide*
