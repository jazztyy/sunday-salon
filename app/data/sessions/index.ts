import type { Session } from '../../types/session'
import { w1 } from './w1'

/** 所有場次，依時間排序。新增一場：建立 wN.ts 並加到陣列最後。 */
export const sessions: Session[] = [w1]

export const latestSession = (): Session => sessions[sessions.length - 1]!

export const findSession = (id: string): Session | undefined => sessions.find(s => s.id === id)
