import { VIDEO_BASE_URL } from './constants'

export function getVideoUrl(filename: string): string {
  return `${VIDEO_BASE_URL}/${encodeURI(filename)}`
}
