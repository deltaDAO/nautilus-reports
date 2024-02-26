import {
  AssetBuilder,
  FileTypes,
  LogLevel,
  Nautilus,
  PublishResponse,
  ServiceBuilder,
  ServiceTypes,
  UrlFile
} from '@deltadao/nautilus'
import PONTUSX_CONFIG from '../../config/pontusx.json'
import { Wallet, ethers } from 'ethers'
import fs from 'fs'
import path from 'path'
import { Config } from '@oceanprotocol/lib'

const reports_dir = path.join(__dirname, `../reports`)
if (!fs.existsSync(reports_dir)) fs.mkdirSync(reports_dir)

const CONFIG: Config = PONTUSX_CONFIG

export async function createPublishAuditTrail() {
  const { nodeUri } = CONFIG

  const provider = new ethers.providers.JsonRpcProvider(nodeUri)
  const wallet = new Wallet(process.env.PRIVATE_KEY, provider)

  Nautilus.setLogLevel(LogLevel.Verbose)
  const nautilus = await Nautilus.create(wallet, CONFIG)

  const owner = await wallet.getAddress()

  const serviceBuilder = new ServiceBuilder({
    serviceType: ServiceTypes.ACCESS,
    fileType: FileTypes.URL
  }) // access type dataset with URL data source

  const urlFile: UrlFile = {
    type: 'url', // there are multiple supported data source types, see https://docs.oceanprotocol.com/developers/storage
    url: 'https://raw.githubusercontent.com/deltaDAO/nautilus-examples/main/example_publish_assets/example-dataset.json', // link to your file or api
    method: 'GET' // HTTP request method
    // headers: {
    //     Authorization: 'Basic XXX' // optional headers field e.g. for basic access control
    // }
  }

  const service = serviceBuilder
    .setServiceEndpoint(CONFIG.providerUri)
    .setTimeout(60)
    .addFile(urlFile)
    .setPricing({ type: 'free' })
    .setDatatokenNameAndSymbol('Test Datatoken', 'TDT') // important for following access token transactions in the explorer
    .build()

  const assetBuilder = new AssetBuilder()
  const asset = assetBuilder
    .setType('dataset')
    .setName('Nautilus-Report: Access Dataset')
    .setDescription(
      '# Nautilus-Example Description \n\nThis asset has been published using the [nautilus-examples](https://github.com/deltaDAO/nautilus-examples) repository.'
    )
    .setAuthor('Example')
    .setLicense('MIT')
    .addService(service)
    .setOwner(owner)
    .build()

  const result = await nautilus.publish(asset)
  console.log(`Publishing complete:`, result)

  const auditTrailName = `${reports_dir}/publish-${result.nftAddress}-trail.md`

  const auditTrail = transformPublishOutputToAuditTrail(result)

  fs.writeFileSync(auditTrailName, auditTrail)
  console.log(`Created a new publish audit trail: ${auditTrailName}`)
}

export function transformPublishOutputToAuditTrail(
  result: PublishResponse
): string {
  const { nftAddress, ddo, services, setMetadataTxReceipt } = result

  const title = `Publish Report for NFT ${nftAddress}`
  const metadata = `---\ntitle: ${title}\ndate: ${ddo.metadata.created}\n---`

  let markdownString = ''
  markdownString += metadata
  markdownString += `\n`
  markdownString += `\n`
  markdownString += `# ${title}`
  markdownString += `\n`
  markdownString += `\n`
  markdownString += `Successfully published a ${ddo.metadata.type} asset with ${services.length} service(s) on network ${ddo.chainId} at ${ddo.metadata.created}.`
  markdownString += `\n`
  markdownString += `\n`
  markdownString += `## Service Overview`
  services.forEach((service, index) => {
    const serviceId = ddo.services.find(
      (s) => s.datatokenAddress === service.datatokenAddress
    )?.id
    markdownString += `\n`
    markdownString += `\n`
    markdownString += `### Service ${serviceId || index}`
    markdownString += `\n`
    if (service.service.name)
      markdownString += `- **Service Name**: ${service.service.name}\n`
    if (service.service.description)
      markdownString += `- **Service Description**: ${service.service.description}\n`
    markdownString += `- **Service Datatoken**: ${service.datatokenAddress}`
    markdownString += `\n`
    markdownString += getTransactionMarkdown(service.tx)
  })
  markdownString += `\n`
  markdownString += `\n`
  markdownString += `## Asset Metadata`
  markdownString += `\n`
  markdownString += `- **DID**: ${ddo.id}`
  markdownString += `\n`
  markdownString += `- **Name**: ${ddo.metadata.name}`
  markdownString += `\n`
  markdownString += `- **Created**: ${ddo.metadata.created}`
  markdownString += `\n`
  markdownString += `- **Explore**: on [Pontus-X portal](https://pontus-x.eu/asset/${ddo.id})`
  markdownString += `\n`
  markdownString += getTransactionMarkdown(setMetadataTxReceipt)

  return markdownString
}

export function getTransactionMarkdown(tx) {
  let markdownString = '- **Transaction**:'
  markdownString += `\n`
  markdownString += `  - **Hash**: ${tx.transactionHash}`
  markdownString += `\n`
  markdownString += `  - **Block Number**: ${tx.blockNumber}`
  if (CONFIG.explorerUri) {
    markdownString += `\n`
    markdownString += `  - **Explorer Link**: [${CONFIG.explorerUri}/tx/${tx.transactionHash.substring(0, 6)}...](${CONFIG.explorerUri}/tx/${tx.transactionHash})`
  }

  return markdownString
}
