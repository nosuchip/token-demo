module.exports = {
  isProduction: process.env.NODE_ENV === 'production',
  isDebug: process.env.NODE_ENV !== 'production',

  port: process.env.PORT || 3000,

  walletPrivateKey: process.env.WALLET_PRIVATE_KEY, // 555d3bee3815104aadae14d4e1788762cf51045eb3b422e33e61a74ae846376d
  etherscanApiKey: process.env.ETHERSCAN_API_KEY,   // 81R5Q6RAB81XTMFXCESI8FPS2BYEZ92RVG
  nodeUrl: process.env.ETHEREUM_NODE_URL
}
