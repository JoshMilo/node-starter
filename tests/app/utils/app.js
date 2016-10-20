const dispatch = require('simple-event-dispatch')
const sinon = require('sinon')
const test = require('ava')

// Init app utils
require(`${process.env.APP_ROOT}/app/utils/app`)


test.serial('should allow replacing express app', t => {
  return dispatch.trigger('App', '_set', {})
    .then(function() {
      t.pass()
    })
})

test.serial('should allow registering middleware', t => {
  const app = {
    use: sinon.spy(),
  }

  return dispatch.trigger('App', '_set', app)
    .then(function() {
      return dispatch.trigger('App', 'use', 'test')
    })
    .then(function() {
      t.true(app.use.calledOnce)
      return dispatch.trigger('App', 'use', [
        ['test2'],
        ['test3'],
      ])
    })
    .then(function() {
      t.is(app.use.callCount, 3)
      t.true(app.use.calledWith('test'))
      t.true(app.use.calledWith('test2'))
      t.true(app.use.calledWith('test3'))
    })
})

test.serial('should allow setting express settings', t => {
  const app = {
    set: sinon.spy(),
  }

  return dispatch.trigger('App', '_set', app)
    .then(function() {
      return dispatch.trigger('App', 'set', 'test', true)
    })
    .then(function() {
      t.true(app.set.calledOnce)
      return dispatch.trigger('App', 'set', [
        ['view engine', 'jade'],
        ['x-powered-by', true],
      ])
    })
    .then(function() {
      t.is(app.set.callCount, 3)
      t.true(app.set.calledWith('test', true))
      t.true(app.set.calledWith('view engine', 'jade'))
      t.true(app.set.calledWith('x-powered-by', true))
    })
})

test.serial('should allow getting express settings', t => {
  const app = {
    get: sinon.spy(function() {
      return true
    }),
  }

  return dispatch.trigger('App', '_set', app)
    .then(function() {
      return dispatch.trigger('App', 'get', 'x-powered-by')
    })
    .then(function(response) {
      t.true(response)
      t.true(app.get.calledOnce)
    })
})

test.serial('should allow getting express app', t => {
  const app = {}

  return dispatch.trigger('App', '_set', app)
    .then(function() {
      return dispatch.trigger('App', 'get')
    })
    .then(function(response) {
      t.is(app, response)
    })
})

