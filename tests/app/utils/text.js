const test = require('ava')
const dispatch = require('simple-event-dispatch')

require(`${process.env.APP_ROOT}/app/utils/text`)


test.serial('should compile template strings', t => {
  return dispatch.trigger('Text', 'compile.template', 'test {{test}} test', {
    test: 'testing',
  })
    .then((str) => {
      t.is(str, 'test testing test')
    })
})

test.serial('should compile template strings with dot notation', t => {
  dispatch.trigger('Text', 'compile.template', 'test {{test.hello}} {{test.world.seattle}}', {
    test: {
      hello: 'hello',
      world: {
        seattle: 'seattle',
      },
    },
  })
    .then((str) => {
      t.is(str, 'test hello seattle')
    })
})

test.serial('should insert empty string for undefined value', t => {
  dispatch.trigger('Text', 'compile.template', 'test {{testing}} test', {
    test: 'testing',
  })
    .then((str) => {
      t.is(str, 'test  test')
      return dispatch.trigger('Text', 'compile.template', 'test {{test.hello}} {{test.world.seattle}}', {
        test: {
          hello: 'hello',
          world: {},
        },
      })
    })
    .then((str) => {
      t.is(str, 'test hello ')
    })
})
