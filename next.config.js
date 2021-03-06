const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

module.exports = (phase) => {
  switch (phase) {
    case PHASE_DEVELOPMENT_SERVER:
      return {
        // environment varibales for local development
        env: {
          USER_POOL_REGION: "ap-northeast-1",
          IDP_DOMAIN: "nextjs-test.auth.ap-northeast-1.amazoncognito.com",
          USER_POOL_ID: process.env.USER_POOL_ID,
          USER_POOL_CLIENT_ID: process.env.USER_POOL_CLIENT_ID,
          REDIRECT_SIGN_IN: "http://localhost:3000/token",
          REDIRECT_SIGN_OUT: "http://localhost:3000/",
          AUTH_COOKIE_DOMAIN: "localhost",

          COGNITO_IDENTITY_POOL_ID: process.env.COGNITO_IDENTITY_POOL_ID,
          GRAPHQL_ENDPOINT: process.env.GRAPHQL_ENDPOINT,
          APPSYNC_APIKEY: process.env.APPSYNC_APIKEY,
        },
      };
    default:
      return {
        // environment varibales for production
        env: {
          USER_POOL_REGION: "ap-northeast-1",
          IDP_DOMAIN: "nextjs-test.auth.ap-northeast-1.amazoncognito.com",
          USER_POOL_ID: process.env.USER_POOL_ID,
          USER_POOL_CLIENT_ID: process.env.USER_POOL_CLIENT_ID,
          REDIRECT_SIGN_IN: "https://next-chat-app.vercel.app/token",
          REDIRECT_SIGN_OUT: "https://next-chat-app.vercel.app/",
          AUTH_COOKIE_DOMAIN: "next-chat-app.vercel.app",

          COGNITO_IDENTITY_POOL_ID: process.env.COGNITO_IDENTITY_POOL_ID,
          GRAPHQL_ENDPOINT: process.env.GRAPHQL_ENDPOINT,
          APPSYNC_APIKEY: process.env.APPSYNC_APIKEY,
        },
      };
  }
};
