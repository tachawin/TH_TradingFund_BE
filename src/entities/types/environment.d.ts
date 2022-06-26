/* eslint-disable no-unused-vars */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'test' | 'development' | 'production'
      PORT: string
    }
  }
}

export {};
