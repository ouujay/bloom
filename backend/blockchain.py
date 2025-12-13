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
if ADMIN_PRIVATE_KEY:
    admin_account = Account.from_key(ADMIN_PRIVATE_KEY)
else:
    admin_account = None
    print("WARNING: ADMIN_PRIVATE_KEY not set in .env")

# Contract ABI - This will be populated after contract compilation
# For now, using the ABI from the guide
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

# Initialize contract (will be None if CONTRACT_ADDRESS not set)
if CONTRACT_ADDRESS:
    try:
        contract = w3.eth.contract(
            address=Web3.to_checksum_address(CONTRACT_ADDRESS),
            abi=CONTRACT_ABI
        )
    except Exception as e:
        print(f"WARNING: Could not initialize contract: {e}")
        contract = None
else:
    contract = None
    print("WARNING: CONTRACT_ADDRESS not set in .env")


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
    if not admin_account or not contract:
        return {
            'success': False,
            'error': 'Admin account or contract not initialized'
        }

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
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)

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
    if not admin_account or not contract:
        return {
            'success': False,
            'error': 'Admin account or contract not initialized'
        }

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
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)

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
    if not admin_account or not contract:
        return {
            'success': False,
            'error': 'Admin account or contract not initialized'
        }

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
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)

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
    if not admin_account or not contract:
        return {
            'success': False,
            'error': 'Admin account or contract not initialized'
        }

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
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)

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
    if not contract:
        print("Error: Contract not initialized")
        return 0

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
    if not contract:
        print("Error: Contract not initialized")
        return 0

    try:
        return contract.functions.getTotalSupply().call()
    except Exception as e:
        print(f"Error getting total supply: {e}")
        return 0


def generate_wallet():
    """
    Generate new Ethereum wallet for a mother

    Returns:
        dict: Wallet address and private key (encrypted storage recommended)
    """
    account = Account.create()
    return {
        'address': account.address,
        'private_key': account.key.hex()  # Store this encrypted!
    }


# Test connection on module load
if __name__ == "__main__":
    print("Testing blockchain connection...")
    print(f"Connected to Base Sepolia: {w3.is_connected()}")
    if w3.is_connected():
        print(f"Latest block: {w3.eth.block_number}")
    if admin_account:
        print(f"Admin address: {admin_account.address}")
    if CONTRACT_ADDRESS:
        print(f"Contract address: {CONTRACT_ADDRESS}")
    else:
        print("WARNING: CONTRACT_ADDRESS not set - deploy contract first")
