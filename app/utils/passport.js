const dispatch = require('simple-event-dispatch')
const bluebird = require('bluebird')

const oauth = require('./oauth')
const passportDispatch = dispatch.module('Passport')

let passport = require('passport')

/**
 * Utility listener to help with testing
 *
 * TODO: disable in production?
 *
 * @param  {Deferred} deferred
 * @param  {Object} _passport -- the replacement passport
 */
passportDispatch.listen('_set', (deferred, _passport) => {
  passport = _passport
  deferred.resolve()
})

passportDispatch.listen('init', (deferred) => {
  bluebird.join(
    dispatch.trigger('App', 'use', passport.initialize()),
    dispatch.trigger('App', 'use', passport.session()),
    () => {
      return [
        dispatch.trigger('User', 'auth.strategy'),
        dispatch.trigger('User', 'auth.serialize'),
        dispatch.trigger('User', 'auth.deserialize'),
      ]
    }
  ).spread((strategy, serialize, deserialize) => {
    passport.use(strategy)
    passport.use(oauth.strategy.google())
    passport.serializeUser(serialize)
    passport.deserializeUser(deserialize)
    deferred.resolve()
  })

})

passportDispatch.listen('authenticate.local', (deferred, req, res, next) => {
  passport.authenticate('local', (err, user) => {
    if (err) {
      return deferred.reject(err)
    }

    deferred.resolve(user)
  })(req, res, next)
})
