module.exports = {
  attachLocals: (req, res, next) => {
    res.locals.user = req.user ? req.user : null
    next()
  },
}
