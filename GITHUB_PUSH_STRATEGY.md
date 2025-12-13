# GitHub Push Strategy - MamaAlert Project

**Date:** December 12, 2025
**Status:** Pre-Push Security Review

---

## 🔐 CRITICAL: Security Checklist (Complete BEFORE Pushing)

### ✅ Step 1: Verify .gitignore Files

Run this command to check what will be committed:
```bash
git status
```

**MUST NOT appear in git status:**
- ❌ `.env` files (contains private keys)
- ❌ `node_modules/`
- ❌ `venv/` or `ENV/`
- ❌ `db.sqlite3` (may contain sensitive test data)
- ❌ `*.pyc` or `__pycache__/`

**If any appear, STOP and add them to .gitignore immediately!**

---

### ✅ Step 2: Search for Hardcoded Secrets

```bash
# Search for private keys
grep -r "PRIVATE_KEY" --include="*.py" --include="*.js" .

# Search for API keys
grep -r "SECRET_KEY" --include="*.py" --include="*.js" .

# Search for hardcoded addresses (should use env vars)
grep -r "0x" --include="*.py" --include="*.js" . | grep -v ".env"
```

**If you find ANY hardcoded secrets:**
1. Remove them immediately
2. Replace with environment variables
3. Add the file containing secrets to commit

---

### ✅ Step 3: Verify Environment Files Are Template-Only

Create `.env.example` files (safe to commit) instead of real `.env` files:

**Create `/bloom/.env.example`:**
```bash
# Ethereum/Base Configuration
BASE_RPC_URL=https://1rpc.io/sepolia
ADMIN_PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS=your_contract_address_here

# Admin Wallet Address
ADMIN_ADDRESS=your_admin_address_here

# Paystack
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key

# Django
SECRET_KEY=your_django_secret_key
DEBUG=True
```

**Create `/mamalert-blockchain/.env.example`:**
```bash
# Ethereum/Base Configuration

## SEPOLIA TESTNET (Public - For Demos)
SEPOLIA_RPC_URL=https://1rpc.io/sepolia
SEPOLIA_CONTRACT_ADDRESS=your_sepolia_contract_address

## LOCAL HARDHAT (Development)
LOCAL_RPC_URL=http://127.0.0.1:8545
LOCAL_CONTRACT_ADDRESS=your_local_contract_address
LOCAL_ADMIN_KEY=your_local_admin_private_key

## ACTIVE CONFIGURATION (Switch as needed)
BASE_RPC_URL=http://127.0.0.1:8545
ADMIN_PRIVATE_KEY=your_admin_private_key
CONTRACT_ADDRESS=your_contract_address

# Admin Wallet Address
ADMIN_ADDRESS=your_admin_address
```

---

## 👤 Git Configuration (Avoid Claude Code Attribution)

### Step 4: Set Your Git Identity

**Before making ANY commits, run:**
```bash
cd /Users/useruser/Documents/bloom

# Set YOUR name and email (not Claude's)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Verify it's set correctly
git config user.name
git config user.email
```

**IMPORTANT:** Replace with your actual name and email!

---

## 📦 What to Commit (Safe Files)

### ✅ Source Code (Safe)
```
mamalert-blockchain/
├── contracts/BloomToken.sol              ✅ SAFE
├── scripts/deploy-local.js               ✅ SAFE
├── scripts/deploy-sepolia.js             ✅ SAFE
├── test/BloomToken.test.js               ✅ SAFE
├── hardhat.config.js                     ✅ SAFE
├── package.json                          ✅ SAFE
└── .env.example                          ✅ SAFE (template only)

bloom/
├── blockchain.py                         ✅ SAFE
├── blockchain_api/
│   ├── views.py                          ✅ SAFE
│   ├── models.py                         ✅ SAFE
│   ├── serializers.py                    ✅ SAFE
│   └── urls.py                           ✅ SAFE
├── test_blockchain.py                    ✅ SAFE
├── manage.py                             ✅ SAFE
├── requirements.txt                      ✅ SAFE
└── .env.example                          ✅ SAFE (template only)
```

### ✅ Documentation (Safe)
```
✅ README.md
✅ API_CONTRACT.md
✅ DEPLOYMENT_SUMMARY.md
✅ DEPLOYMENT_COMPARISON.md
✅ BLOCKCHAIN_STATUS.md
✅ DEVELOPER_A_ROADMAP.md
✅ DEVELOPER_A_COMPLETION_REVIEW.md
✅ START_SERVER.md
✅ API_DOCUMENTATION.md
✅ QUICK_REFERENCE.md
✅ GITHUB_PUSH_STRATEGY.md (this file)
```

### ❌ What NOT to Commit (Dangerous)

```
❌ .env                                   CONTAINS PRIVATE KEYS
❌ *.env                                  CONTAINS SECRETS
❌ node_modules/                          TOO LARGE
❌ venv/                                  TOO LARGE
❌ __pycache__/                           BUILD ARTIFACTS
❌ db.sqlite3                             MAY CONTAIN SENSITIVE DATA
❌ *.log                                  MAY CONTAIN SENSITIVE INFO
❌ artifacts/                             BUILD ARTIFACTS
❌ cache/                                 BUILD ARTIFACTS
```

---

## 📝 Commit Strategy

### Step 5: Create .env.example Files First

```bash
# From the root directory
cd /Users/useruser/Documents/bloom

# Create .env.example for Django project
cat > .env.example << 'EOF'
# Ethereum/Base Configuration
BASE_RPC_URL=https://1rpc.io/sepolia
ADMIN_PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS=your_contract_address_here

# Admin Wallet Address
ADMIN_ADDRESS=your_admin_address_here

# Paystack
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key

# Django
SECRET_KEY=your_django_secret_key
DEBUG=True
EOF

# Create .env.example for blockchain project
cd mamalert-blockchain
cat > .env.example << 'EOF'
# Ethereum/Base Configuration

## SEPOLIA TESTNET (Public - For Demos)
SEPOLIA_RPC_URL=https://1rpc.io/sepolia
SEPOLIA_CONTRACT_ADDRESS=your_sepolia_contract_address

## LOCAL HARDHAT (Development)
LOCAL_RPC_URL=http://127.0.0.1:8545
LOCAL_CONTRACT_ADDRESS=your_local_contract_address
LOCAL_ADMIN_KEY=your_local_admin_private_key

## ACTIVE CONFIGURATION
BASE_RPC_URL=http://127.0.0.1:8545
ADMIN_PRIVATE_KEY=your_admin_private_key
CONTRACT_ADDRESS=your_contract_address

# Admin Wallet Address
ADMIN_ADDRESS=your_admin_address
EOF

cd ..
```

---

### Step 6: Initialize Git Repository (If Not Already)

```bash
cd /Users/useruser/Documents/bloom

# Check if git is initialized
if [ ! -d .git ]; then
  git init
  echo "✅ Git repository initialized"
else
  echo "✅ Git repository already exists"
fi
```

---

### Step 7: Staged Commit Strategy (Recommended)

**Commit in logical chunks for clarity:**

#### Commit 1: Blockchain Smart Contract
```bash
git add mamalert-blockchain/contracts/
git add mamalert-blockchain/scripts/
git add mamalert-blockchain/hardhat.config.js
git add mamalert-blockchain/package.json
git add mamalert-blockchain/.gitignore
git add mamalert-blockchain/.env.example

git commit -m "feat: Add BloomToken ERC20 smart contract

- Implement BloomToken.sol with mint/burn functions
- Add deployment scripts for local and Sepolia networks
- Configure Hardhat v3 with ESM module support
- Add donation recording and withdrawal tracking on-chain"
```

#### Commit 2: Django Blockchain Integration
```bash
git add blockchain.py
git add blockchain_api/
git add test_blockchain.py
git add .env.example
git add .gitignore

git commit -m "feat: Add Django blockchain integration layer

- Create blockchain.py Web3 integration module
- Implement all API endpoints (mint, burn, withdraw, balance)
- Add Paystack webhook for donation recording
- Include comprehensive test suite (8/8 tests passing)"
```

#### Commit 3: Documentation
```bash
git add README.md
git add API_CONTRACT.md
git add DEPLOYMENT_SUMMARY.md
git add DEPLOYMENT_COMPARISON.md
git add BLOCKCHAIN_STATUS.md
git add DEVELOPER_A_ROADMAP.md
git add DEVELOPER_A_COMPLETION_REVIEW.md
git add START_SERVER.md
git add API_DOCUMENTATION.md
git add QUICK_REFERENCE.md
git add GITHUB_PUSH_STRATEGY.md

git commit -m "docs: Add comprehensive project documentation

- Add API contract for Developer A/B integration
- Document deployment on Local Hardhat and Ethereum Sepolia
- Include testing results and Etherscan verification
- Add developer roadmap and completion review"
```

#### Commit 4: Configuration Files
```bash
git add requirements.txt
git add manage.py
git add *.md

git commit -m "chore: Add project configuration and remaining docs

- Add Python dependencies (requirements.txt)
- Include Django management files
- Add remaining markdown documentation"
```

---

## 🌳 Branch Strategy

### Recommended: Feature Branch Workflow

```bash
# Create main branch if it doesn't exist
git checkout -b main

# Create development branch
git checkout -b develop

# For each feature, create a feature branch
git checkout -b feature/blockchain-integration

# After commits, merge back to develop
git checkout develop
git merge feature/blockchain-integration

# When ready for production
git checkout main
git merge develop
```

### Simpler: Single Branch (For Small Teams)

```bash
# Just work on main branch
git checkout -b main

# Make all commits directly to main
git add .
git commit -m "Your commit message"
```

---

## 🚀 Pre-Push Final Checklist

Before running `git push`, verify ALL of these:

### Security Checks
- [ ] No `.env` files in `git status`
- [ ] No private keys in any committed file
- [ ] No API keys hardcoded in source code
- [ ] `.gitignore` includes all sensitive patterns
- [ ] `.env.example` files created with placeholder values
- [ ] `db.sqlite3` not in git status (may contain test data)

### Git Configuration
- [ ] `git config user.name` shows YOUR name (not Claude)
- [ ] `git config user.email` shows YOUR email
- [ ] All commits show your authorship: `git log --oneline`

### Code Quality
- [ ] No `node_modules/` or `venv/` in commits
- [ ] No build artifacts (`artifacts/`, `cache/`, `__pycache__/`)
- [ ] All import statements work
- [ ] No placeholder TODOs like "TODO: Add real value"

### Documentation
- [ ] README.md has setup instructions
- [ ] API_CONTRACT.md is up to date
- [ ] No references to local file paths in docs

---

## 🔗 Connecting to GitHub

### Step 8: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `mamalert-blockchain` (or your preferred name)
3. Description: "Blockchain-based maternal health incentive platform"
4. **Privacy:** Private (recommended for now)
5. **DO NOT** initialize with README (you already have one)
6. Click "Create repository"

---

### Step 9: Add Remote and Push

```bash
cd /Users/useruser/Documents/bloom

# Add GitHub remote (replace with YOUR repository URL)
git remote add origin https://github.com/YOUR_USERNAME/mamalert-blockchain.git

# Verify remote is set
git remote -v

# Push to GitHub
git push -u origin main
```

**For subsequent pushes:**
```bash
git push
```

---

## 🔒 Post-Push Security Verification

### Step 10: Verify on GitHub

1. Go to your GitHub repository
2. Click through each file
3. **VERIFY THESE DO NOT APPEAR:**
   - ❌ Private keys (search for "0xac0974" or "0x2564591")
   - ❌ API keys (search for "sk_test" or "pk_test")
   - ❌ Real wallet addresses (your admin wallet)
   - ❌ `.env` files

4. **IF YOU SEE ANY SECRETS:**
   - **IMMEDIATELY** delete the repository
   - Remove secrets from local files
   - Create new private keys
   - Start over with clean commits

---

## 📊 Recommended .gitignore (Final Version)

**Root `.gitignore`:**
```gitignore
# Environment variables - CRITICAL
.env
*.env
.env.local
.env.*.local
!.env.example

# Python
venv/
ENV/
env/
__pycache__/
*.py[cod]
*$py.class
*.so
.Python

# Django
*.log
db.sqlite3
db.sqlite3-journal
/media
/staticfiles

# Node
node_modules/
npm-debug.log*

# Hardhat
cache/
artifacts/
typechain/
typechain-types/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Coverage
coverage/
*.lcov
.pytest_cache/
```

---

## 🎯 Quick Push Commands (After Setup)

**Daily workflow after initial setup:**

```bash
# See what changed
git status

# Add specific files (safer than git add .)
git add blockchain.py
git add blockchain_api/views.py

# Commit with descriptive message
git commit -m "fix: Improve error handling in mint_tokens endpoint"

# Push to GitHub
git push
```

---

## ⚠️ Common Mistakes to Avoid

| Mistake | Why It's Bad | Solution |
|---------|--------------|----------|
| `git add .` | May include secrets | Use `git add <specific-files>` |
| Committing `.env` | Exposes private keys | Add to .gitignore, remove from git |
| Using `--force` push | Overwrites history | Never force push on main |
| Not reviewing commits | May miss secrets | Always `git diff --cached` before commit |
| Committing `node_modules/` | Bloats repository | Add to .gitignore |

---

## 🛟 Emergency: "I Pushed Secrets to GitHub!"

**If you accidentally pushed private keys or secrets:**

### Step 1: IMMEDIATELY Rotate All Secrets
```bash
# Generate new admin wallet
# Update all private keys
# Change all API keys
```

### Step 2: Remove Secrets from Git History
```bash
# Delete the repository from GitHub
# OR use git-filter-branch (advanced)

# Remove sensitive file from all commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push cleaned history
git push origin --force --all
```

### Step 3: Verify Secrets Are Gone
- Search repository on GitHub
- Check all commits in history
- Regenerate all compromised keys

**Prevention is better than cure - follow this checklist BEFORE pushing!**

---

## ✅ Final Recommendation

### Before Your First Push:

1. **Review this entire document**
2. **Run security checks** (Steps 1-3)
3. **Set git config** (Step 4)
4. **Create .env.example** (Step 5)
5. **Stage commits logically** (Step 7)
6. **Verify with `git status` and `git diff`**
7. **Push to GitHub** (Steps 8-9)
8. **Verify on GitHub** (Step 10)

### After Setup (Daily):
```bash
git status                    # See changes
git add specific-files        # Stage specific files
git commit -m "message"       # Commit with clear message
git diff --cached             # Review before pushing
git push                      # Push to GitHub
```

---

## 📞 Questions?

- **Forgot to set git config?** Run `git config user.name "Your Name"` now
- **Accidentally staged .env?** Run `git reset .env` to unstage
- **Want to undo last commit?** Run `git reset --soft HEAD~1`
- **Pushed secrets?** Follow emergency procedure above

---

**Your code is ready to push once you complete the security checklist!** ✅

