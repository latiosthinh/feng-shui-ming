import PocketBase from 'pocketbase'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

let _pb: PocketBase | null = null

export function getPocketBase(): PocketBase {
  if (!_pb) {
    _pb = new PocketBase(PB_URL)
  }
  return _pb
}

export function createPocketBase(token?: string): PocketBase {
  const pb = new PocketBase(PB_URL)
  if (token) {
    pb.authStore.save(token)
  }
  return pb
}
