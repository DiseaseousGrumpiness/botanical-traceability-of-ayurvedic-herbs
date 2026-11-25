/** Minimal Kubo/IPFS HTTP API client using Node's built-in fetch/FormData. */
export function createIPFSClient({ apiUrl, apiToken = '', fetchImpl = fetch }) {
  if (!apiUrl) return null
  let base
  try { base = new URL(apiUrl) } catch { throw new Error('IPFS_API_URL must be a valid HTTP(S) URL') }
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) throw new Error('IPFS_API_URL must be an HTTP(S) URL without embedded credentials')

  return {
    async add({ bytes, fileName, contentType }) {
      const form = new FormData()
      form.append('file', new Blob([bytes], { type: contentType }), fileName)
      let response
      try {
        response = await fetchImpl(new URL('/api/v0/add?pin=true&cid-version=1', base), {
          method: 'POST',
          headers: apiToken ? { Authorization: `Bearer ${apiToken}` } : {},
          body: form,
        })
      } catch {
        throw new Error('The configured IPFS API could not be reached')
      }
      if (!response.ok) throw new Error(`IPFS upload failed with HTTP ${response.status}`)
      const text = await response.text()
      let result
      try {
        const lines = text.trim().split(/\r?\n/)
        result = JSON.parse(lines[lines.length - 1])
      } catch {
        throw new Error('IPFS returned an invalid upload response')
      }
      if (typeof result.Hash !== 'string' || !result.Hash || result.Hash.length > 128) throw new Error('IPFS upload response did not include a valid CID')
      return result.Hash
    },
  }
}
