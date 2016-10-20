const bcrypt = require('bcrypt')
const bluebird = require('bluebird')
const dispatch = require('simple-event-dispatch')
const express = require('express')

const router = express.Router()

const language = require(`${process.env.APP_ROOT}/app/language`)
const authMiddleware = require(`${process.env.APP_ROOT}/app/routes/middleware/authentication`)


router.post('/register', registerPOST)
router.post('/login', loginPOST)
router.post('/reset-password', resetPasswordPOST)
router.post('/reset-password/:token', resetPasswordTokenPOST)

router.post('/api/user/update/:id', userUpdatePOST)
router.post('/api/user/update-photo/:id', userUpdatePhotoPOST)

router.get('/api/user/displayname-exists', authMiddleware.isAuthenticated, displaynameExistsGET)
router.get('/api/user/email-exists', authMiddleware.isAuthenticated, emailExistsGET)


module.exports = router


function registerPOST(req, res) {
  if (!req.body.username || !req.body.password) {
    req.flash('error', language.error.invalid.credentials)
    return res.redirect(303, '/register')
  }

  /**
   * Generate email verification token
   */
  dispatch.trigger('User', 'generate.token', req.body.username)

  /**
   * Create user
   */
  .then((/* _token */) => {
    // token = _token;

    return dispatch.trigger('User', 'create', {
      username: req.body.username,
      password: req.body.password,
    })
  })

  /**
   * Generate verification email string
   */
  // .then((_user) => {
  //   user = _user;

  //   return dispatch.trigger('Text', 'compile.template',
  //     language.message.email.verification.message, {
  //       firstName: user.profile.name.first,
  //       host: req.headers.host,
  //       token: token
  //     });
  // })

  /**
   * Send verification email
   */
  // .then((email) => {
  //   return dispatch.trigger('Email', 'send', {
  //     to: [{
  //       email: user.username,
  //       name: user.profile.name.first + ' ' + user.profile.name.last,
  //       type: 'to'
  //     }],
  //     subject: language.message.email.verification.subject,
  //     message: email
  //   });
  // })

  /**
   * Generate success message
   */
  // .then(() => {
  //   return dispatch.trigger('Text', 'compile.template',
  //     language.message.email.verification.sent, {
  //       email: user.username
  //     });
  // })

  /**
   * Log the user in
   */
  .then((user) => {
    return dispatch.trigger('User', 'login', req, user)
  })

  /**
   * redirect to the dashboard, or show an error
   */
  .then(() => {
    res.redirect(303, '/dashboard')
  })

  .catch((err) => {
    req.flash('error', err.message)
    res.redirect(303, '/register')
  })
}


function loginPOST(req, res, next) {
  dispatch.trigger('User', 'find', {
    username: req.body.username,
  })
    .then((results) => {
      if (results.length) {
        bluebird.promisify(bcrypt.compare)(req.body.password, results[0].legacyPassword)
          .then((match) => {

            if (match) {

              dispatch.trigger('User', 'set.password', results[0], req.body.password)
                .then((user) => {
                  user.legacyPassword = null
                  return dispatch.trigger('User', 'save', user)
                })
                .then((user) => {
                  return dispatch.trigger('User', 'login', req, user)
                })
                .then((authSuccessful) => {
                  if (authSuccessful) {
                    res.redirect(303, '/dashboard')
                  } else {
                    return bluebird.reject(new Error(language.error.invalid.credentials))
                  }
                })
                .catch((err) => {
                  req.flash('error', err.message)
                  res.redirect(303, '/login')
                })

            } else {
              req.flash('error', language.error.invalid.credentials)
              res.redirect(303, '/login')
            }

          })
      } else {
        dispatch.trigger('Passport', 'authenticate.local', req, res, next)
          .then((user) => {
            return dispatch.trigger('User', 'login', req, user)
          })
          .then((authSuccessful) => {
            if (authSuccessful) {
              res.redirect(303, '/dashboard')
            } else {
              return bluebird.reject(new Error(language.error.invalid.credentials))
            }
          })
          .catch((err) => {
            req.flash('error', err.message)
            res.redirect(303, '/login')
          })
      }
    })
}


function resetPasswordPOST(req, res) {
  if (!req.body.username) {
    req.flash('error', language.error.invalid.email)
    return res.redirect(303, '/reset-password')
  }

  let token
  let user

  /**
   * Generate reset token
   */
  dispatch.trigger('User', 'generate.token', req.body.username)

  /**
   * Look for a user with the provided email
   */
  .then((_token) => {
    token = _token
    return dispatch.trigger('User', 'find', {
      username: req.body.username,
    })
  })

  /**
   * Save the token to the user instance, if the user exists
   */
  .then((users) => {
    if (users.length === 0) {
      return bluebird.reject(new Error(language.error.invalid.email))
    }

    user = users[0]
    user.tokens.password = token
    user.legacyPassword = null

    return dispatch.trigger('User', 'save', user)
  })

  /**
   * Genereate email message
   */
  .then((user) => {
    return dispatch.trigger('Text', 'compile.template',
      language.email.password.reset, {
        firstName: user.profile.name.first,
        host: req.headers.host,
        token: token,
      })
  })

  /**
   * Send emails with reset instructions to user
   */
  .then((email) => {
    return dispatch.trigger('Email', 'send', {
      to: [{
        email: user.username,
        name: user.profile.name.first + ' ' + user.profile.name.last,
        type: 'to',
      }],
      subject: language.email.password.subject,
      message: email,
    })
  })

  /**
   * Generate success message
   */
  .then(() => {
    return dispatch.trigger('Text', 'compile.template',
      language.email.password.sent, {
        email: user.username,
      })
  })

  /**
   * Redirect to reset page with success message
   */
  .then((message) => {
    req.flash('success', message)
    res.redirect(303, '/reset-password')
  })

  /**
   * Redirect to reset page with error message if user couldn't be found,
   * otherwise flash errors and redirect to reset-password
   */
  .catch((err) => {
    req.flash('error', err.message)
    res.redirect(303, '/reset-password')
  })
}


function resetPasswordTokenPOST(req, res) {

  if (!req.body.id) {
    req.flash('error', language.error.missing.id)
    return res.redirect(303, '/reset-password/' + req.params.token)
  }

  dispatch.trigger('User', 'set.password', req.body.id, req.body.password)
    .then((user) => {
      user.tokens.password = null
      return dispatch.trigger('User', 'save', user)
    })
    .then(() => {
      req.flash('success', language.success.passwordReset)
      res.redirect(303, '/login')
    })
    .catch((err) => {
      req.flash('error', err.message)
      res.redirect(303, '/reset-password/' + req.params.token)
    })
}


function displaynameExistsGET(req, res, next) {
  const displayname = req.query.displayname

  if (!displayname) {
    return res.status(500).json({
      message: 'No display name provided',
    })
  }

  dispatch.trigger('User', 'count', {
    displayname: displayname,
    username: {
      $ne: req.user.username,
    },
  })
    .then((count) => {
      res.status(200).json({
        count: count,
      })
    })
    .catch((err) => {
      next(err)
    })
}


function emailExistsGET(req, res, next) {
  const username = req.query.username

  if (!username) {
    return res.status(500).json({
      message: 'No email provided',
    })
  }

  dispatch.trigger('User', 'count', {
    username: username,
  })
    .then((count) => {
      res.status(200).json({
        count: count,
      })
    })
    .catch((err) => {
      next(err)
    })
}


/* TODO: cleanup the update functions */
function userUpdatePOST(req, res) {
  if (!req.params.id || !req.body) {
    res.status(500).json({
      message: 'ID and body required',
    })
  }

  const b = req.body

  dispatch.trigger('User', 'find', {
    _id: req.params.id,
  })
    .then((user) => {

      let _user = user[0]
      let emailUpdated = false

      if (!_user) {
        throw new Error('User not found')
      }

      // dispatch.trigger('User', 'authenticate', _user, b.originalPassword)

      // .then((user) => {
      //   if (user.username !== req.body.username) emailUpdated = true;
      //   return dispatch.trigger('User', 'update', req.params.id, b);
      // })

      if (_user.username !== req.body.username) emailUpdated = true

      dispatch.trigger('User', 'update', req.params.id, b)

        .then((user) => {
          _user = user
          if (b.password) {
            return dispatch.trigger('User', 'set.password', user, b.password)
          }
          return bluebird.resolve()
        })

        .then((user) => {
          if (user) {
            _user = user
            return dispatch.trigger('User', 'save', user)
          }
          return bluebird.resolve()
        })

        .then(() => {
          if (emailUpdated) {
            return dispatch.trigger('User', 'login', req, _user)
          }
          return bluebird.resolve()
        })

        .then(() => {
          res.status(200).json({
            success: true,
          })
        })

        .catch((err) => {
          res.status(500).json({
            message: err.message,
          })
        })
    })
    .catch((err) => {
      res.status(500).json({
        message: err.message,
      })
    })
}

function userUpdatePhotoPOST(req, res) {
  if (!req.params.id || !req.body) {
    res.status(500).json({
      message: 'ID and body required',
    })
  }

  dispatch.trigger('User', 'update', req.params.id, req.body)
    .then((user) => {
      const returnValues = {}

      Object.keys(req.body).forEach((v) => {
        returnValues[v] = user[v]
      })

      res.status(200).json(returnValues)
    })
    .catch((err) => {
      res.status(500).json({
        message: err.message,
      })
    })
}
