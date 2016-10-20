/**
 * Process handlebars-like template strings
 * @param  {String} str  - the template string
 * @param  {Object} data - data to provide to the template string
 * @return {String}      - the processed template string
 */
module.exports = (str, data) => {
  return str.replace(/{{[^{}]+}}/g, (key) => {
    if (!/\./.test(key)) {
      var val = data[ key.replace(/\s*[{}]+\s*/g, '') ]
      return val === undefined ? '' : val
    } else {
      return key
        .replace(/\s*[{}]+\s*/g, '')
        .split('.')
        .reduce(function (prev, curr) {
          return prev[curr] === undefined ? '' : prev[curr]
        }, data)
    }
  })
}
