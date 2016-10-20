module.exports = {
  isAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) return next()
    res.redirect(303, '/login')
  },
}
