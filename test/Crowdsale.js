const { expect } = require('chai')
const { ethers } = require('hardhat')

const tokens = (n) => ethers.utils.parseUnits(n.toString(), 'ether')
const ether = tokens

describe('Crowdsale', () => {
  let crowdsale, token, whitelist
  let accounts, deployer, user1, user2

  beforeEach(async () => {
    // Load Contracts
    const Crowdsale = await ethers.getContractFactory('Crowdsale')
    const Token = await ethers.getContractFactory('Token')
    const Whitelist = await ethers.getContractFactory('Whitelist')

    // Deploy Token
    token = await Token.deploy('NME Wrestling Token', 'NME', '1000000')

    // Configure Accounts
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    user1 = accounts[1]
    user2 = accounts[2]

    // Deploy Whitelist
    whitelist = await Whitelist.deploy()
    await whitelist.deployed()

    // Add user1 to the whitelist
    await whitelist.connect(deployer).addAddress(user1.address)

    // Deploy Crowdsale
    crowdsale = await Crowdsale.deploy(
      token.address,
      whitelist.address,
      ether(1),
      '1000000',
      tokens(10),
      tokens(100),
      '1630464000'
    )

    // Send tokens to Crowdsale
    const transaction = await token
      .connect(deployer)
      .transfer(crowdsale.address, tokens(1000000))
    await transaction.wait()
  })

  describe('Deployment', () => {
    it('sends tokens to the Crowdsale contract', async () => {
      expect(await token.balanceOf(crowdsale.address)).to.equal(tokens(1000000))
    })

    it('returns the price', async () => {
      expect(await crowdsale.price()).to.equal(ether(1))
    })

    it('has the correct token', async () => {
      expect(await crowdsale.token()).to.equal(token.address)
    })

    it('has the correct whitelist', async () => {
      expect(await crowdsale.whitelist()).to.equal(whitelist.address)
    })

    it('has the correct minimum purchase', async () => {
      expect(await crowdsale.minimumPurchase()).to.equal(tokens(10))
    })

    it('has the correct maximum purchase', async () => {
      expect(await crowdsale.maximumPurchase()).to.equal(tokens(100))
    })

    it('has the correct start date', async () => {
      expect(await crowdsale.startDate()).to.equal('1630464000')
    })
  })

  describe('Buying Tokens', () => {
    const amount = tokens(10)

    describe('Success', () => {
      beforeEach(async () => {
        // user1 (whitelisted) buys tokens
        const transaction = await crowdsale
          .connect(user1)
          .buyTokens(amount, user1.address, {
            value: ether(10),
          })
        await transaction.wait()
      })

      it('transfers tokens', async () => {
        expect(await token.balanceOf(crowdsale.address)).to.equal(
          tokens(999990)
        )
        expect(await token.balanceOf(user1.address)).to.equal(amount)
      })

      it('updates the contract ETH balance', async () => {
        expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(
          ether(10)
        )
      })

      it('updates tokensSold', async () => {
        expect(await crowdsale.tokensSold()).to.equal(amount)
      })

      it('emits a Buy event', async () => {
        await expect(
          crowdsale
            .connect(user1)
            .buyTokens(amount, user1.address, { value: ether(10) })
        )
          .to.emit(crowdsale, 'Buy')
          .withArgs(amount, user1.address)
      })
    })

    describe('Failure', () => {
      it('rejects insufficient ETH', async () => {
        await expect(
          crowdsale
            .connect(user1)
            .buyTokens(tokens(10), user1.address, { value: ether(5) })
        ).to.be.revertedWith('Crowdsale: Incorrect ETH amount')
      })

      it('rejects non-whitelisted users', async () => {
        await expect(
          crowdsale
            .connect(user2)
            .buyTokens(amount, user2.address, { value: ether(10) })
        ).to.be.revertedWith('Crowdsale: Buyer is not whitelisted')
      })

      it('rejects purchases below the minimum', async () => {
        await expect(
          crowdsale
            .connect(user1)
            .buyTokens(tokens(5), user1.address, { value: ether(2.5) })
        ).to.be.revertedWith('Crowdsale: Amount is less than minimum purchase')
      })

      it('rejects purchases above the maximum', async () => {
        await expect(
          crowdsale
            .connect(user1)
            .buyTokens(tokens(101), user1.address, { value: ether(101) })
        ).to.be.revertedWith('Crowdsale: Amount is more than maximum purchase')
      })

      it('rejects purchases before the start date', async () => {
        // redeploy crowdsale with a future start date
        const Crowdsale2 = await ethers.getContractFactory('Crowdsale')
        const Token2 = await ethers.getContractFactory('Token')
        let token2 = await Token2.deploy(
          'NME Wrestling Token',
          'NME',
          '1000000'
        )
        let crowdsale2 = await Crowdsale2.deploy(
          token2.address,
          whitelist.address,
          ether(1),
          '1000000',
          tokens(10),
          tokens(100),
          '9999999999'
        )
        const transaction = await token2
          .connect(deployer)
          .transfer(crowdsale2.address, tokens(1000000))
        await transaction.wait()

        await expect(
          crowdsale2
            .connect(user1)
            .buyTokens(amount, user1.address, { value: ether(10) })
        ).to.be.revertedWith('Crowdsale: Sale has not started yet')
      })
    })
  })

  describe('Updating Price', () => {
    const newPrice = ether(2)

    describe('Success', () => {
      beforeEach(async () => {
        const transaction = await crowdsale.connect(deployer).setPrice(newPrice)
        await transaction.wait()
      })

      it('updates the price', async () => {
        expect(await crowdsale.price()).to.equal(newPrice)
      })
    })

    describe('Failure', () => {
      it('prevents non-owners from updating the price', async () => {
        await expect(
          crowdsale.connect(user1).setPrice(newPrice)
        ).to.be.revertedWith('Caller is not the owner')
      })
    })
  })

  describe('Finalizing Sale', () => {
    const amount = tokens(10) // Amount of tokens to buy
    const value = ether(10) // ETH value for the purchase

    describe('Success', () => {
      let transaction, result

      beforeEach(async () => {
        // user1 (whitelisted) buys tokens
        transaction = await crowdsale
          .connect(user1)
          .buyTokens(amount, user1.address, { value })
        await transaction.wait()
      })

      it('transfers remaining tokens to owner', async () => {
        transaction = await crowdsale.connect(deployer).finalize()
        await transaction.wait()

        expect(await token.balanceOf(crowdsale.address)).to.equal(tokens(0))
        expect(await token.balanceOf(deployer.address)).to.equal(tokens(999990))
      })

      it('transfers ETH balance to owner', async () => {
        transaction = await crowdsale.connect(deployer).finalize()
        await transaction.wait()

        expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(0)
      })

      it('emits a Finalize event', async () => {
        await expect(crowdsale.connect(deployer).finalize())
          .to.emit(crowdsale, 'Finalize')
          .withArgs(amount, value) // Correctly expect tokensSold and ETH value
      })
    })

    describe('Failure', () => {
      it('prevents non-owners from finalizing', async () => {
        await expect(crowdsale.connect(user1).finalize()).to.be.revertedWith(
          'Caller is not the owner'
        )
      })
    })
  })
})
