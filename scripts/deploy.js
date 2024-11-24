const hre = require('hardhat')

async function main() {
  const NAME = 'NME Wrestling Token'
  const SYMBOL = 'NME'
  const MAX_SUPPLY = '1000000'
  const PRICE = hre.ethers.utils.parseUnits('0.025', 'ether')

  // Deploy Token
  const Token = await hre.ethers.getContractFactory('Token')
  let token = await Token.deploy(NAME, SYMBOL, MAX_SUPPLY)

  console.log(`Token deployed to: ${token.address}\n`)

  // Deploy Crowdsale
  const Crowdsale = await hre.ethers.getContractFactory('Crowdsale')
  let crowdsale = await Crowdsale.deploy(
    token.address,
    PRICE,
    hre.ethers.utils.parseUnits(MAX_SUPPLY, 'ether')
  )

  console.log(`Crowdsale deployed to: ${crowdsale.address}\n`)

  // Send tokens to crowdsale
  const transaction = await token.transfer(
    crowdsale.address,
    hre.ethers.utils.parseUnits(MAX_SUPPLY, 'ether')
  )
  await transaction.wait()

  console.log(`Tokens transferred to Crowdsale\n`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
