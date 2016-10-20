const dispatch = require('simple-event-dispatch')
const express = require('express')

const appDispatch = dispatch.module('App')

let app = express()

// app.locals.pretty = true

/**
 * Utility listener to help with testing
 *
 * @param  {Deferred} deferred
 * @param  {Object} _app -- the replacement app
 */
appDispatch.listen('_set', function(deferred, _app) {
  app = _app
  deferred.resolve()
})

appDispatch.listen('use', function(deferred) {
  const args = Array.prototype.slice.call(arguments, 1)

  if (Array.isArray(args[0])) {
    args[0].forEach(function(v) {
      app.use.apply(app, v)
    })
  } else {
    app.use.apply(app, args)
  }

  deferred.resolve()
})

appDispatch.listen('set', function(deferred) {
  const args = Array.prototype.slice.call(arguments, 1)

  if (Array.isArray(args[0])) {
    args[0].forEach(function(v) {
      app.set.apply(app, v)
    })
  } else {
    app.set.apply(app, args)
  }

  deferred.resolve()
})

appDispatch.listen('get', function(deferred, what) {
  if (what === undefined) {
    return deferred.resolve(app)
  }

  deferred.resolve(app.get(what))
})
