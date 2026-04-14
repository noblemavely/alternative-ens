// Use a lazy-loaded getter so environment variables are read at access time, not at module load time
export const ENV = new Proxy({}, {
  get: (target, prop: string) => {
    switch (prop) {
      case "appId":
        return process.env.VITE_APP_ID ?? "";
      case "cookieSecret":
        return process.env.JWT_SECRET ?? "";
      case "databaseUrl":
        return process.env.DATABASE_URL ?? "";
      case "oAuthServerUrl":
        return process.env.OAUTH_SERVER_URL ?? "";
      case "ownerOpenId":
        return process.env.OWNER_OPEN_ID ?? "";
      case "isProduction":
        return process.env.NODE_ENV === "production";
      case "forgeApiUrl":
        return process.env.BUILT_IN_FORGE_API_URL ?? "";
      case "forgeApiKey":
        return process.env.BUILT_IN_FORGE_API_KEY ?? "";
      case "linkedinClientId":
        return process.env.LINKEDIN_CLIENT_ID ?? "";
      case "linkedinClientSecret":
        return process.env.LINKEDIN_CLIENT_SECRET ?? "";
      case "appOrigin":
        return process.env.APP_ORIGIN ?? "https://expert-net-ggrdr6ye.manus.space";
      case "claudeApiKey":
        return process.env.CLAUDE_API_KEY ?? "";
      case "apolloApiKey":
        return process.env.APOLLO_API_KEY ?? "";
      case "smtpHost":
        return process.env.SMTP_HOST ?? "";
      case "smtpPort":
        return parseInt(process.env.SMTP_PORT || "587");
      case "smtpUser":
        return process.env.SMTP_USER ?? "";
      case "smtpPassword":
        return process.env.SMTP_PASSWORD ?? "";
      case "smtpFromEmail":
        return process.env.SMTP_FROM_EMAIL ?? "";
      case "smtpFromName":
        return process.env.SMTP_FROM_NAME ?? "Alternatives Team";
      default:
        return undefined;
    }
  }
} as any);
