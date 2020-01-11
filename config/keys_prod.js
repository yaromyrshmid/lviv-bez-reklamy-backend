module.exports = {
  mongoURI: process.env.MONGO_URI,
  secret: process.env.MONGO_SECRET,
  googleAuth: {
    clientID: process.env.GOOGLE_AUTH_CLIENT_ID,
    clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_AUTH_CALLBACK_URL
  },
  googleMapAPI: process.env.GOOGLE_MAP_API,
  frontEndURL: process.env.FRONT_END_URL
};
