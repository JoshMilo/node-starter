const mongoose = require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose')

const config = require(`${process.env.APP_ROOT}/app/config`)

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },

  tokens: {
    password: String,
    verification: String,
  },

  oauth: {
    google: String,
  },

  meta: {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
})

UserSchema.pre('save', () => {
  this.meta.updatedAt = Date.now()
})

UserSchema.virtual('profile.name.full').get(() => {
  return this.profile.name.first + ' ' + this.profile.name.last
})

UserSchema.plugin(passportLocalMongoose, config.password)

mongoose.model('User', UserSchema)
