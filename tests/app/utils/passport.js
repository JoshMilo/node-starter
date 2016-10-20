const dispatch = require('simple-event-dispatch')
const sinon = require('sinon')
const test = require('ava')

require(`${process.env.APP_ROOT}/app/utils/passport`)


test.serial('should allow replacing passport', t => {
  return dispatch.trigger('Passport', '_set', {})
    .then(() => {
      t.pass()
    })
})

test.serial('should use local authentication', t => {
  const returnSpy = sinon.spy()
  const user = {}
  const req = {}
  const res = {}
  const next = () => {}
  const passport = {
    authenticate: sinon.spy((strat, cb) => {
      cb(null, user)
      return returnSpy
    }),
  }

  return dispatch.trigger('Passport', '_set', passport)
    .then(() => {
      return dispatch.trigger('Passport', 'authenticate.local', req, res, next)
    })
    .then((_user) => {
      t.true(passport.authenticate.calledOnce)
      t.true(returnSpy.calledOnce)
      t.true(returnSpy.calledWith(req, res, next))
      t.is(user, _user)
    })
})

test.serial('should reject authenticate.local deferred on error', t => {
  const returnSpy = sinon.spy()
  const req = {}
  const res = {}
  const next = () => {}
  const passport = {
    authenticate: sinon.spy((strat, cb) => {
      cb(new Error('test'))
      return returnSpy
    }),
  }

  t.throws(
    dispatch.trigger('Passport', '_set', passport)
      .then(() => {
        return dispatch.trigger('Passport', 'authenticate.local', req, res, next)
      })
  )
})

// TODO: why does this cause the tests to hang?
test.serial('should initialize passport', t => {
  const mockAppDispatch = dispatch.module('App')
  const mockUserDispatch = dispatch.module('User')

  const passport = {
    initialize: sinon.spy(),
    session: sinon.spy(),
    use: sinon.spy(),
    serializeUser: sinon.spy(),
    deserializeUser: sinon.spy(),
  }

  const strategy = {}
  const serialize = {}
  const deserialize = {}

  mockAppDispatch.listen('use', (deferred) => {
    deferred.resolve()
  })
  mockUserDispatch.listen('auth.strategy', (deferred) => {
    deferred.resolve(strategy)
  })
  mockUserDispatch.listen('auth.serialize', (deferred) => {
    deferred.resolve(serialize)
  })
  mockUserDispatch.listen('auth.deserialize', (deferred) => {
    deferred.resolve(deserialize)
  })

  return dispatch.trigger('Passport', '_set', passport)
    .then(() => {
      return dispatch.trigger('Passport', 'init')
    })
    .then(() => {
      t.true(passport.initialize.calledOnce)
      t.true(passport.session.calledOnce)
      t.true(passport.use.calledWith(strategy))
      t.true(passport.serializeUser.calledWith(serialize))
      t.true(passport.deserializeUser.calledWith(deserialize))
    })
})

