import * as dotenv from 'dotenv'
import { createPublishAuditTrail } from './audit'
import { createConsumptionReport } from './consumption'
dotenv.config()

async function main() {
  const args = process.argv
  const index = args.findIndex((arg) => arg.match(/[-]?-t[ype]?/))
  if (index < 0) {
    console.error(
      'Could not find required argument for type. Use -t or --type to set a type.'
    )
    return
  }

  const type = args[index + 1]
  switch (type) {
    case 'audit':
      await createPublishAuditTrail()
      break
    case 'consumption':
      await createConsumptionReport()
      break
    default:
      console.error(
        "Please choose a type of report to run. Possible options: 'audit', 'consumption'"
      )
  }
}

main()
