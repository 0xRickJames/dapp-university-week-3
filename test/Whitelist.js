/* eslint-disable no-unused-expressions */
const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Whitelist', function () {
  let Whitelist, whitelist, account, owner, addr1, addr2

  beforeEach(async function () {
    // Deploy the contract
    Whitelist = await ethers.getContractFactory('Whitelist')
    whitelist = await Whitelist.deploy()
    await whitelist.deployed()

    // Get accounts
    account = await ethers.getSigners()
    owner = account[0]
    addr1 = account[1]
    addr2 = account[2]
  })

  describe('Deployment', function () {
    it('Should set the correct owner', async function () {
      expect(await whitelist.owner()).to.equal(owner.address)
    })
  })

  describe('Adding and Removing Addresses', function () {
    describe('Success', function () {
      it('adds an address to the whitelist', async function () {
        await whitelist.addAddress(addr1.address)
        expect(await whitelist.isWhitelisted(addr1.address)).to.be.true
      })

      it('emits AddressAdded event when adding an address', async function () {
        await expect(whitelist.addAddress(addr1.address))
          .to.emit(whitelist, 'AddressAdded')
          .withArgs(addr1.address)
      })

      it('removess an address from the whitelist', async function () {
        await whitelist.addAddress(addr1.address)
        await whitelist.removeAddress(addr1.address)
        expect(await whitelist.isWhitelisted(addr1.address)).to.be.false
      })

      it('emits AddressRemoved event when removing an address', async function () {
        await whitelist.addAddress(addr1.address)
        await expect(whitelist.removeAddress(addr1.address))
          .to.emit(whitelist, 'AddressRemoved')
          .withArgs(addr1.address)
      })
    })
    describe('Failure', function () {
      it('prevents non-owners from adding to the whitelist', async function () {
        await expect(
          whitelist.connect(addr1).addAddress(addr2.address)
        ).to.be.revertedWith('Whitelist: Only owner can call this function')
      })

      it('prevents non-owners from removing from the whitelist', async function () {
        await whitelist.addAddress(addr1.address)
        await expect(
          whitelist.connect(addr1).removeAddress(addr1.address)
        ).to.be.revertedWith('Whitelist: Only owner can call this function')
      })
    })
  })

  describe('Whitelist Protection', function () {
    it('reverts when trying to add an already whitelisted address', async function () {
      await whitelist.addAddress(addr1.address)
      await expect(whitelist.addAddress(addr1.address)).to.be.revertedWith(
        'Whitelist: Address is already whitelisted'
      )
    })

    it('reverts when trying to remove a non-whitelisted address', async function () {
      await expect(whitelist.removeAddress(addr1.address)).to.be.revertedWith(
        'Whitelist: Address is not whitelisted'
      )
    })
  })
})
