const bluebird = require('bluebird')
const crypto = require('crypto')
const dispatch = require('simple-event-dispatch')
const mongoose = require('mongoose')

require(`${process.env.APP_ROOT}/app/models/user`)

const User = mongoose.model('User')
const userDispatch = dispatch.module('User')


/**
 * Create then-able copies of all methods
 */
bluebird.promisifyAll(User)
bluebird.promisifyAll(User.prototype)


/**
 * Create a user. Password hashing and salting takes place in the User.register
 * method.
 *
 * @param  {Object} user -- Object containing user data, username and password
 *                       are mandatory
 * @return {User} -- the newly created user
 */
userDispatch.listen('create', (deferred, user) => {
  const newUser = new User(user)

  User.registerAsync(newUser, user.password)
    .then((account) => {
      // console.log('success', account.username)
      deferred.fulfill(account)
    })
    .catch((err) => {
      deferred.reject(err)
    })
})

userDispatch.listen('create.oauth', (deferred, user) => {
  User.createAsync(user)
    .then((account) => {
      // console.log('success', account.username)
      deferred.fulfill(account)
    })
    .catch((err) => {
      deferred.reject(err)
    })
})


/**
 * Delete a user.
 *
 * @param  {String} id -- Mongo ID
 */
userDispatch.listen('delete', (deferred, id) => {
  User.findByIdAndRemoveAsync(id)
    .then(() => {
      deferred.fulfill()
    })
    .catch((err) => {
      deferred.reject(err)
    })
})


/**
 * Update a user.
 *
 * @param  {String} id      -- Mongo ID
 * @param  {Object} updates -- properties to update
 * @return {User}           -- the updated user
 */
userDispatch.listen('update', (deferred, id, updates) => {

  dispatch.trigger('User', 'find', {
    _id: id,
  })
    .then((users) => {
      if (users.length === 0) {
        return bluebird.reject(new Error('update: User not found'))
      }

      const user = copyUserUpdates(users[0], updates)

      return dispatch.trigger('User', 'save', user)
    })
    .then((user) => {
      deferred.fulfill(user)
    })
    .catch((err) => {
      deferred.reject(err)
    })

})

function copyUserUpdates(user, updates) {
  Object.keys(updates).forEach((v) => {
    user[v] = updates[v]
  })

  return user
}


/**
 * Find user(s) and return an array of results.
 *
 * @param {Object} query -- search params
 * @param {Object} fields -- optional fields to return
 * @param {Object} options -- optional options to pass to Model.find
 * @return {Array} -- and array of users matching the query
 */
userDispatch.listen('find', (deferred) => {
  const args = Array.prototype.slice.call(arguments, 1)

  if (args.length > 3) {
    return deferred
      .reject(new Error('User Dispatch: Too many arguments passed to find.'))
  }

  User.findAsync.apply(User, args)
    .then((users) => {
      deferred.fulfill(users)
    })
    .catch((err) => {
      deferred.reject(err)
    })

})



/**
 * Counts user(s) based on a query and returns the count
 *
 * @param {Object} query -- search params
 * @return {Number} -- a count of the matches
 */
userDispatch.listen('count', (deferred, query) => {

  User.countAsync(query)
    .then((count) => {
      deferred.fulfill(count)
    })

})



/**
 * Update a user's password
 *
 * @param  {String|User} userOrId -- the user or id of the user to update
 * @param  {String} password -- the new password
 * @return {User} -- the updated user
 */
userDispatch.listen('set.password', (deferred, userOrId, password) => {

  (
    userOrId && userOrId._id ?

    bluebird.promisify(userOrId.setPassword, userOrId)(password) :

    User.findByIdAsync(userOrId).then((user) => {
      if (!user) {
        return bluebird.reject(new Error('set.password: User not found'))
      }
      return bluebird.promisify(user.setPassword, user)(password)
    })
  ).then((user) => {
    deferred.fulfill(user)
  })
    .catch((err) => {
      deferred.reject(err)
    })

})



/**
 * Authenticate a user's password
 *
 * @param  {User} user -- the user to authenticate
 * @param  {String} password -- the user's password
 * @return {User} -- the authenticated user
 */
userDispatch.listen('authenticate', (deferred, user, password) => {
  bluebird.promisify(user.authenticate, user)(password)
    .then((user) => {
      if (Array.isArray(user) && user[1] && user[1].message) {
        throw new Error(user[1].message)
      }
      deferred.fulfill(user)
    })
    .catch((err) => {
      deferred.reject(err)
    })
})



/**
 * Save a user instance
 *
 * @param  {User} user -- the user instance to save
 * @return {User} -- the saved user
 */
userDispatch.listen('save', (deferred, user) => {
  if (!user || user && !user.save) {
    return deferred.reject(new TypeError('User save: expected a User instance'))
  }

  bluebird.promisify(user.save, user)()
    .then(() => {
      deferred.fulfill(user)
    })
    .catch((err) => {
      deferred.reject(err)
    })
})


/**
 * Generate a passport strategy
 *
 * @return {PassportStrategy}
 */
userDispatch.listen('auth.strategy', (deferred) => {
  deferred.fulfill(User.createStrategy())
})

/**
 * Generate a passport serialize function
 *
 * @return {PassportSerializeUser}
 */
userDispatch.listen('auth.serialize', (deferred) => {
  deferred.fulfill(User.serializeUser())
})

/**
 * Generate a passport deserialize function
 *
 * @return {PassportDeserializeUser}
 */
userDispatch.listen('auth.deserialize', (deferred) => {
  deferred.fulfill(User.deserializeUser())
})



/**
 * Attempt to log the user in. If successful, the deferred will be fullfilled
 * with authStatus === true, otherwise authStatus === false
 *
 * @param  {Object} req -- The HTTP request object from express
 * @param  {User} user -- A user instance
 * @return {Boolean} authStatus -- Was the login successful?
 */
userDispatch.listen('login', (deferred, req, user) => {
  if (!user) {
    return deferred.fulfill(false)
  }

  bluebird.promisify(req.logIn, req)(user)
    .then(() => {
      deferred.fulfill(true)
    })
    .catch((err) => {
      deferred.reject(err)
    })
})


/**
 * Generate a unique token for use during password reset, etc...
 *
 * @param  {String} username
 * @return {String} token
 */
userDispatch.listen('generate.token', (deferred, username) => {
  bluebird.promisify(crypto.pseudoRandomBytes, crypto)(15)
    .then((buffer) => {
      deferred.fulfill(buffer.toString('hex') + hashString(username))
    })
})

function hashString(s) {
  let hash = 0, i, chr, len

  if (s.length === 0) return hash

  for (i = 0, len = s.length; i < len; i++) {
    chr = s.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0
  }
  return hash
}
