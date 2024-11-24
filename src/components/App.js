import { useState, useEffect } from 'react'
import { Container } from 'react-bootstrap'
import { ethers } from 'ethers'

// Components
import Navigation from './Navigation'
import Info from './Info'
import Loading from './Loading'
import Progress from './Progress'

// ABIs
import TOKEN_ABI from '../abi/Token.json'
import CROWDSALE_ABI from '../abi/Crowdsale.json'

import config from '../config'

function App() {
  const [provider, setProvider] = useState(null)
  const [crowdsale, setCrowdsale] = useState(null)

  const [account, setAccount] = useState(null)
  const [accountBalance, setAccountBalance] = useState(0)

  const [price, setPrice] = useState(0)
  const [maxTokens, setMaxTokens] = useState(0)
  const [tokensSold, setTokensSold] = useState(0)

  const [isLoading, setIsLoading] = useState(true)

  const loadBlockchainData = async () => {
    // Initiate provider
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)

    // Initiate contracts
    const token = new ethers.Contract(
      config[37337].token.address,
      TOKEN_ABI,
      provider
    )
    const crowdsale = new ethers.Contract(
      config[37337].crowdsale.address,
      CROWDSALE_ABI,
      provider
    )
    setCrowdsale(crowdsale)

    // Fetch accounts
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    })
    const account = accounts[0]
    setAccount(account)

    // Fetch account balance
    const accountBalance = ethers.utils.formatUnits(
      await token.balanceOf(account),
      18
    )
    setAccountBalance(accountBalance)

    // Fetch price
    const price = ethers.utils.formatUnits(await crowdsale.price(), 18)
    setPrice(price)

    // Fetch max tokens
    const maxTokens = ethers.utils.formatUnits(await crowdsale.maxTokens(), 18)
    setMaxTokens(maxTokens)

    // Fetch tokens sold
    const tokensSold = ethers.utils.formatUnits(
      await crowdsale.tokensSold(),
      18
    )
    setTokensSold(tokensSold)

    setIsLoading(false)

    // Add to State
  }

  useEffect(() => {
    if (isLoading) {
      loadBlockchainData()
    }
  }, [isLoading])

  return (
    <Container>
      <Navigation />

      <h1 className="my-4 text-center">Introducing NME Token!</h1>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <p className="text-center">
            <strong>Current Price:</strong> {price} ETH
            <Progress maxTokens={maxTokens} tokensSold={tokensSold} />
          </p>
        </>
      )}
      <hr />
      {account && <Info account={account} accountBalance={accountBalance} />}
    </Container>
  )
}

export default App