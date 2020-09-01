import * as forge from 'node-forge'
import * as archiver from 'archiver'
import { createHash } from 'crypto'

declare module 'node-forge' {
  namespace pkcs7 {
    function messageToPem(p7: PkcsSignedData): string
  }
}

export interface SignOptions {
  pem?: string
  crt?: string
  key?: string
}

export interface PushPackageEntry {
  name: string
  buffer: Buffer
}

export interface PushPackageManifest {
  [key: string]: {
    hashType: 'sha512'
    hashValue: string
  }
}

export function sign(content: Buffer | string, options: SignOptions) {
  if (!options.pem && (!options.key || !options.crt)) { throw new Error('Invalid options') }
  const [crt, key] = options.pem
    ? forge.pem.decode(options.pem).map((obj) => forge.pem.encode(obj))
    : [options.crt!, options.key!]
  const certificate = forge.pki.certificateFromPem(crt)
  const p7 = forge.pkcs7.createSignedData()
  p7.content = forge.util.createBuffer(content)
  p7.addCertificate(crt)
  p7.addSigner({ key, certificate, digestAlgorithm: forge.pki.oids.sha256, authenticatedAttributes: [] })
  p7.sign({ detached: true })
  return forge.pem.decode(forge.pkcs7.messageToPem(p7))[0].body
}



export function create(entries: PushPackageEntry[], options: SignOptions) {
  const archive = archiver('zip', { zlib: { level: 9 }})
  for (const { buffer, name } of entries) {
    archive.append(buffer, { name })
  }
  const manifest = entries.reduce<PushPackageManifest>((obj, { name, buffer }) => {
    const hashValue = createHash('sha512').update(buffer).digest('hex')
    obj[name] = { hashType: 'sha512', hashValue }
    return obj
  }, {})
  const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8')
  archive.append(manifestBuffer, { name: 'manifest.json' })

  const signature = sign(manifestBuffer, options)
  const buffer = Buffer.from(signature, 'binary')
  archive.append(buffer, { name: 'signature' })
  return archive
}

export function pipe(entries: PushPackageEntry[], destination: NodeJS.WritableStream, options: SignOptions) {
  return new Promise<void>((resolve, reject) => {
    const archive = create(entries, options)
    archive.pipe(destination)
    archive.on('error', reject)
    archive.finalize().then(resolve)
  })
}
