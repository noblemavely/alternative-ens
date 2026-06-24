export default {
  apps: [
    {
      name: "alternative-ens",
      script: "dist/server/_core/index.js",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        DATABASE_URL: "mysql://u263459454_alternatives:v8H56U3Jyejj@localhost:3306/u263459454_alternatives",
        JWT_SECRET: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
        VITE_APP_ID: "alternative-ens",
        APP_ORIGIN: "https://alternatives.nativeworld.com",
        APOLLO_API_KEY: "H75VrL5qdNaXDI9P5-xGDQ",
        APOLLO_CLIENT_ID: "JhtPb5BDO1fI8dquNf6Ptbi6Te-HjtE4s5qplc9VZs4",
        APOLLO_CLIENT_SECRET: "FM0QMHjPgQd7qo7H1gSpVj53gZsAKjxDyhI577-5FS0",
      },
    },
  ],
};
