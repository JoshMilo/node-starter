module.exports = {
  db: {
    url: process.env.MONGODB_URL,
  },
  mailgun: {
    apiKey: process.env.KEY_MAILGUN,
  },
  session: {
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: 1209600000,
    },
  },
  password: {
    saltlen: 32,
    iterations: 25000,
    keylen: 512,
    usernameLowerCase: false,
  },
  facebook: {
    id: process.env.FACEBOOK_ID,
    secret: process.env.FACEBOOK_SECRET,
    callback: process.env.FACEBOOK_CALLBACK,
  },
  google: {
    id: process.env.GOOGLE_ID,
    secret: process.env.GOOGLE_SECRET,
    callback: process.env.GOOGLE_CALLBACK,
  },
}
