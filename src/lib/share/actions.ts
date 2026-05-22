'use server'

import { createShare, getShare, likeName, getLikeCounts } from './storage'
import type { ShareShortlistData, ShareNameEntry } from './types'

export async function createShareShortlistAction(
  names: ShareNameEntry[],
  locale: string,
  surname?: string,
): Promise<ShareShortlistData> {
  return createShare(names, locale, surname)
}

export async function getShareAction(
  token: string,
): Promise<(ShareShortlistData & { likes: Record<string, string[]> }) | null> {
  return getShare(token)
}

export async function likeNameAction(
  token: string,
  nameIndex: number,
  fingerprint: string,
): Promise<{ nameIndex: number; count: number } | null> {
  return likeName(token, nameIndex, fingerprint)
}

export async function getLikeCountsAction(token: string): Promise<Record<string, number>> {
  return getLikeCounts(token)
}
