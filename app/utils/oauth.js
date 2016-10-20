const dispatch = require('simple-event-dispatch')
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy

const config = require(`${process.env.APP_ROOT}/app/config`)

module.exports = {
  strategy: {
    google: function() {
      return new GoogleStrategy({
        clientID: config.google.id,
        clientSecret: config.google.secret,
        callbackURL: config.google.callback,
      },
        function(accessToken, refreshToken, profile, cb) {

          dispatch.trigger('User', 'find', {
            'oauth.google': profile.id,
          }).then(function(user) {
            if (user.length) {
              return cb(null, user[0])
            }

            let profilePhoto

            if (profile.photos && profile.photos.length && profile.photos[0].value) {
              profilePhoto = profile.photos[0].value.replace(/sz=\d+$/, 'sz=175')
            }

            dispatch.trigger('User', 'create.oauth', {
              username: profile.emails[0].value,
              profile: {
                name: {
                  first: profile.name.givenName,
                  last: profile.name.familyName,
                },
                avatarURL: profilePhoto || null,
              },
              oauth: {
                google: profile.id.toString(),
              },
            }).then(function(user) {
              return cb(null, user)
            }).catch(function(err) {
              return cb(err)
            })

          }).catch(function(err) {
            return cb(err)
          })

        })
    },
  },
}
