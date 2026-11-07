import { createContext } from 'react'

export interface BoardContextValue {
  caseId: string
  readOnly: boolean
}

export const BoardContext = createContext<BoardContextValue>({ caseId: '', readOnly: true })
