const dispatch = require('simple-event-dispatch')
const processTemplateString = require('./processTemplateString')
const textDispatch = dispatch.module('Text')

textDispatch.listen('compile.template', (deferred, template, data) => {
  deferred.resolve( processTemplateString(template, data) )
})
