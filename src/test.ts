import { readFileSync, createWriteStream } from 'fs'
import * as pushpackage from '.'

async function main() {
  // Prepare Options
  const pem = readFileSync('fixtures/certificate.pem', 'utf8')
  const options = { pem }

  // Sign Manifest
  const content = readFileSync('fixtures/manifest.json')
  const signature = pushpackage.sign(content, options)

  // Create Push Package
  const output = createWriteStream('fixtures/output.pushPackage')
  const entries = [
    { name: 'sample.txt', buffer: Buffer.from('awesome') },
    { name: 'sample2.txt', buffer: Buffer.from('hello world') }
  ]
  await pushpackage.pipe(entries, output, options)
}

main()
