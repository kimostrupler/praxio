declare module 'next-auth' {
  interface Session {
    user: {
      id:    string
      email: string
      name:  string
      role:  'ADMIN' | 'STAFF'
    }
  }
  interface User {
    role:           'ADMIN' | 'STAFF'
    sessionVersion: number
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id:             string
    role:           'ADMIN' | 'STAFF'
    sessionVersion: number
    checkedAt:      number
  }
}

export {}
