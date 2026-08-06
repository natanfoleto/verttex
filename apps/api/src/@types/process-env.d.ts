declare namespace NodeJS {
  interface ProcessEnv {
    SERVER_PORT?: string
    DATABASE_URL?: string
    JWT_SECRET?: string
    COOKIE_SECRET?: string
    CORS_ORIGIN?: string
  }
}
