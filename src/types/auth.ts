export type UserRole = 'admin' | 'user'

export interface User {
  id: number
  username: string
  avatar: string
  role: UserRole
}
