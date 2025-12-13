# MamaAlert - Developer A Workspace

## Welcome, Developer A!

You are responsible for building the blockchain infrastructure for MamaAlert, a maternal health incentive platform that rewards mothers with BLOOM tokens for completing healthy actions.

This workspace contains everything you need to succeed.

---

## Your Mission

Build a complete blockchain layer that:
1. Records donations transparently on Base blockchain
2. Mints BLOOM tokens when mothers complete healthy actions
3. Manages withdrawals with admin approval
4. Integrates smoothly with Developer B's frontend

**Estimated Time:** 10-12 hours
**Technology:** Ethereum (Base Sepolia), Solidity, Django, Web3.py

---

## Document Guide

### 📋 Start Here (In Order)

1. **dev-split-ethereum.md** - The complete technical specification
   - Read this first to understand the entire project
   - Contains all code you'll need to copy
   - Your primary technical reference

2. **DEVELOPER_A_ROADMAP.md** - Your strategic execution plan
   - 5 phases broken down into specific tasks
   - Risk mitigation strategies
   - Integration checkpoints with Developer B
   - Verification checklists
   - **READ THIS BEFORE YOU START CODING**

3. **API_CONTRACT.md** - Agreement with Developer B
   - Exact API specifications
   - Request/response formats
   - Error codes
   - Integration examples
   - **SHARE THIS WITH DEVELOPER B EARLY**

4. **PROGRESS_CHECKLIST.md** - Your daily tracker
   - Checkbox for every task
   - Track what's done, what's pending
   - Integration checkpoints
   - Security checklist
   - **UPDATE THIS DAILY**

5. **QUICK_REFERENCE.md** - Commands & troubleshooting
   - Copy-paste ready commands
   - Common issues & solutions
   - Testing snippets
   - Emergency procedures
   - **KEEP THIS OPEN WHILE CODING**

---

## Quick Start (3 Steps)

### Step 1: Read & Understand (1 hour)
```bash
cd /Users/useruser/Documents/bloom

# Read in this order:
# 1. dev-split-ethereum.md (30 mins - skim smart contract code, read everything else)
# 2. DEVELOPER_A_ROADMAP.md (20 mins - understand the strategy)
# 3. API_CONTRACT.md (10 mins - see what Developer B needs)
```

### Step 2: Environment Setup (2 hours)
```bash
# Follow Phase 1 in DEVELOPER_A_ROADMAP.md
# Or follow the "Setup Tasks" section in dev-split-ethereum.md

# Key deliverables:
# ✓ Hardhat installed
# ✓ Admin wallet created and funded
# ✓ .env file configured
# ✓ Git security in place
```

### Step 3: Deploy Smart Contract (2 hours)
```bash
# Follow Phase 2 in DEVELOPER_A_ROADMAP.md
# Or follow the "Smart Contract Development" section in dev-split-ethereum.md

# Key deliverables:
# ✓ BloomToken.sol deployed to Base Sepolia
# ✓ Contract verified on Basescan
# ✓ Contract address shared with Developer B
```

**After these 3 steps, you've completed 40% of the work!**

---

## Recommended Workflow

### Day 1 (4-6 hours)
- [ ] Read all documentation
- [ ] Complete Phase 1: Environment Setup
- [ ] Complete Phase 2: Smart Contract Deployment
- [ ] **Checkpoint:** Share contract address with Developer B

### Day 2 (4-6 hours)
- [ ] Complete Phase 3: Blockchain Integration (blockchain.py)
- [ ] Run all tests in test_blockchain.py
- [ ] Start Phase 4: Django models
- [ ] **Checkpoint:** Demo working blockchain to Developer B

### Day 3 (4-6 hours)
- [ ] Complete Phase 4: All API endpoints
- [ ] Share API_CONTRACT.md with Developer B
- [ ] Complete Phase 5: Integration testing
- [ ] **Checkpoint:** Test complete flow with Developer B
- [ ] 🎉 Done!

---

## Critical Success Factors

### 1. Security First
- **NEVER** commit `.env` to git
- **ALWAYS** verify webhook signatures
- **TEST** on testnet before mainnet

### 2. Communication with Developer B
- Daily 5-minute sync
- Share contract address immediately after Phase 2
- Test integration together at each checkpoint
- Use API_CONTRACT.md as single source of truth

### 3. Methodical Progress
- Follow phases in order - don't skip ahead
- Test each component before moving on
- Use PROGRESS_CHECKLIST.md to track
- When stuck, check QUICK_REFERENCE.md

### 4. Blockchain Verification
- Every transaction should be visible on Basescan
- Database should never contradict blockchain
- Blockchain is the source of truth

---

## File Structure

```
bloom/
├── README.md                      ← You are here
├── dev-split-ethereum.md          ← Technical specification (PROVIDED)
├── DEVELOPER_A_ROADMAP.md         ← Strategic execution plan (CREATED)
├── API_CONTRACT.md                ← Integration contract (CREATED)
├── PROGRESS_CHECKLIST.md          ← Daily tracker (CREATED)
├── QUICK_REFERENCE.md             ← Commands & troubleshooting (CREATED)
│
├── mamalert-blockchain/           ← You will create this
│   ├── contracts/
│   │   └── BloomToken.sol         ← Smart contract
│   ├── scripts/
│   │   └── deploy.js              ← Deployment script
│   ├── hardhat.config.js          ← Hardhat configuration
│   ├── .env                       ← Secrets (DO NOT COMMIT)
│   └── package.json
│
├── backend/                       ← Django project (you or Developer B creates)
│   ├── blockchain.py              ← Web3 integration module
│   ├── test_blockchain.py         ← Test script
│   ├── views.py                   ← API endpoints
│   ├── models.py                  ← Database models
│   └── urls.py                    ← API routing
│
└── frontend/                      ← Developer B's responsibility
    └── (React/Next.js app)
```

---

## Key Deliverables to Developer B

Developer B needs these from you:

1. **Contract Address** (after Phase 2)
   ```
   CONTRACT_ADDRESS=0xYourDeployedAddress
   ```

2. **API Documentation** (after Phase 4)
   - Share API_CONTRACT.md
   - Include example requests/responses

3. **Environment Variables** (for deployment)
   ```
   BASE_RPC_URL=https://sepolia.base.org
   CONTRACT_ADDRESS=0xYourAddress
   ```

4. **Database Models** (Phase 4)
   - User.wallet_address
   - TokenTransaction model
   - WithdrawalRequest model

5. **Integration Testing** (Phase 5)
   - Test together
   - Verify end-to-end flows

---

## Support Resources

### When You're Stuck

1. **Check QUICK_REFERENCE.md** for common issues
2. **Search error on Basescan** - revert reasons are shown
3. **Check Hardhat docs** - https://hardhat.org/docs
4. **Check Web3.py docs** - https://web3py.readthedocs.io
5. **Ask Developer B** - maybe they've seen it
6. **Check GitHub issues** for Hardhat/Web3.py

### Testing Tools

- **Basescan Sepolia:** https://sepolia.basescan.org
- **Base Faucet:** https://www.alchemy.com/faucets/base-sepolia
- **Hardhat Console:** `npx hardhat console --network baseSepolia`
- **Django Shell:** `python manage.py shell`
- **Test Script:** `python test_blockchain.py`

---

## Success Metrics

You'll know you're done when:

✅ Smart contract deployed and verified on Basescan
✅ All 6 blockchain functions tested and working
✅ All API endpoints implemented and documented
✅ Developer B successfully integrated
✅ Complete user flow tested end-to-end
✅ All transactions visible on blockchain explorer
✅ No security vulnerabilities
✅ Error handling graceful and informative

---

## What Makes This Project Easier

**Compared to other blockchain projects:**
- ✅ Using Ethereum (not Solana) = 95% Claude Code support
- ✅ Clean transaction hashes = easy database storage
- ✅ Readable blockchain explorer = donors can verify
- ✅ Simple token minting = no complex DeFi logic
- ✅ Admin approval withdrawals = no automatic payouts to worry about
- ✅ Complete code provided = mostly copy and configure

**Your advantages:**
- Complete technical specification provided
- Strategic roadmap created
- Integration contract defined
- Troubleshooting guide ready
- Testing scripts included

**You can do this!**

---

## Emergency Contacts

**Developer B:** [Fill in contact info]

**Technical Lead:** [Fill in contact info]

**Project Manager:** [Fill in contact info]

---

## Next Steps

1. ☐ Read DEVELOPER_A_ROADMAP.md completely (20 mins)
2. ☐ Set up environment (Phase 1) (2 hours)
3. ☐ Deploy smart contract (Phase 2) (2 hours)
4. ☐ Update PROGRESS_CHECKLIST.md after each task
5. ☐ Share contract address with Developer B
6. ☐ Continue with Phase 3...

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-12 | Initial workspace setup |

---

**Good luck, Developer A! You've got this! 🚀**

*Remember: Blockchain development is methodical, not magical. Follow the roadmap, test everything, communicate with Developer B, and you'll succeed.*

---

## Quick Commands (Most Used)

```bash
# Deploy contract
npx hardhat run scripts/deploy.js --network baseSepolia

# Test blockchain integration
python test_blockchain.py

# Run Django server
python manage.py runserver

# Check git status
git status

# Commit progress
git add . && git commit -m "Completed Phase X"

# Update checklist
# Edit PROGRESS_CHECKLIST.md and mark [x]
```

---

**Last Updated:** 2024-12-12
**Status:** Ready to start
**Estimated Completion:** 3 days (10-12 hours total)
