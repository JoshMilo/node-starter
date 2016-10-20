module.exports = {
  attachLocals: (req, res, next) => {
    res.locals.protocol = req.protocol
    res.locals.host = req.get('host')
    res.locals.url = req.protocol + '://' + req.get('host') + req.originalUrl
    res.locals.appVersion = require(`${process.env.APP_ROOT}/package.json`).version
    next()
  },
}
