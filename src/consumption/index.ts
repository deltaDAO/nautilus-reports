import { LogLevel, Nautilus } from '@deltadao/nautilus'
import { Config } from '@oceanprotocol/lib'
import { Wallet, ethers } from 'ethers'
import fs from 'fs'
import path from 'path'
import PONTUSX_CONFIG from '../../config/pontusx.json'

const reports_dir = path.join(__dirname, `../reports`)
if (!fs.existsSync(reports_dir)) fs.mkdirSync(reports_dir)

const CONFIG: Config = PONTUSX_CONFIG

const DATASET_DID = `did:op:272c5fe3e0fdb1a1c06466e60fa229f2bbb7be8f54b5cb26c28952fc9d43d243`
const ALGO_DID = `did:op:0ae3069c26e968057a5a7666b07eb29928ce55744e6be3240eb7a5affa973445`

export async function createConsumptionReport() {
  const { nodeUri } = CONFIG

  const provider = new ethers.providers.JsonRpcProvider(nodeUri)
  const wallet = new Wallet(process.env.PRIVATE_KEY, provider)

  Nautilus.setLogLevel(LogLevel.Verbose)
  const nautilus = await Nautilus.create(wallet, CONFIG)

  const computeResult = await nautilus.compute({
    dataset: {
      did: DATASET_DID
    },
    algorithm: {
      did: ALGO_DID
    }
  })

  const computeJob = Array.isArray(computeResult)
    ? computeResult[0]
    : computeResult

  const datasetDDO = await nautilus.getAquariusAsset(DATASET_DID)

  let computeStatus = { ...computeJob }
  // 31 - DATA PROVISIONING FAILED
  // 32 - ALGORITHM PROVISIONING FAILED
  // 70 - JOB FINISHED
  while (![31, 32, 70].includes(computeStatus.status)) {
    console.log('Polling compute status update...')
    computeStatus = await nautilus.getComputeStatus({
      jobId: computeJob.jobId,
      providerUri: datasetDDO.services.find(
        (service) => service.type === 'compute'
      ).serviceEndpoint
    })
    console.log('New status:', { computeStatus })
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }

  const reportName = `${reports_dir}/consumption-report-${computeJob.jobId}.md`

  const consumptiuonReport = transformComputeResponseToReport(
    computeJob,
    computeStatus
  )

  fs.writeFileSync(reportName, consumptiuonReport)
  console.log(`Created a new consumption report: ${reportName}`)
}

export function transformComputeResponseToReport(job, finalStatus): string {
  let markdownString = ``

  const title = `Consumption Report for Compute Job ${job.jobId}`
  const metadata = `---\ntitle: ${title}\ndate:${job.dateCreated}\n---`

  markdownString += metadata
  markdownString += `\n`
  markdownString += `\n`
  markdownString += `# ${title}`
  markdownString += `\n`
  markdownString += `\n`
  markdownString += `## Overview`
  markdownString += `\n`
  markdownString += `- **Owner**: ${job.owner}`
  markdownString += `\n`
  markdownString += `- **Dataset**: [${job.inputDID[0]}](https://pontus-x.eu/asset/${job.inputDID[0]})`
  markdownString += `\n`
  markdownString += `- **Algorithm**: [${job.algoDID}](https://pontus-x.eu/asset/${job.algoDID})`
  markdownString += `\n`
  markdownString += `- **Date created**: ${job.dateCreated}`
  markdownString += `\n`
  markdownString += `- **Transaction**: [${job.agreementId}](${CONFIG.explorerUri}/tx/${job.agreementId})`
  markdownString += `\n`
  markdownString += `- **Explore**: on your [Pontus-X portal profile](https://pontus-x.eu/profile/${job.owner}?defaultTab=computeJobs)`
  markdownString += `\n`
  markdownString += `\n`
  markdownString += `## Status Report`
  markdownString += `\n`
  markdownString += `- **Final status**: ${finalStatus.statusText} (${finalStatus.status})`
  markdownString += `\n`
  markdownString += `- **Date finished**: ${finalStatus.dateFinished}`
  markdownString += `\n`
  markdownString += `- **Results**:`
  markdownString += `\n`
  finalStatus.results.forEach((result) => {
    markdownString += `  - **Filename**: ${result.filename}`
    markdownString += `\n`
    markdownString += `    - **Filesize (kb)**: ${result.filesize}`
    markdownString += `\n`
    markdownString += `    - **Type**: ${result.type}`
    markdownString += `\n`
  })

  return markdownString
}
