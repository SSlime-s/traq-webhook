const core = require('@actions/core')
const github = require('@actions/github')
const crypto = require('crypto')
const fetch = require('node-fetch')
const makeMessage = require('./utils/makeMessage')

const calcHMACSHA1 = (message, secret) => crypto.createHmac('sha1', secret).update(message).digest('hex')

try {
  const id = core.getInput('webhook-id')
  const secret = core.getInput('webhook-secret', { required: false })
  const channelId = core.getInput('channel-id', { required: false })

  const context = github.context
  const message = makeMessage(context)

  if (typeof message === 'string') {
    const url = `https://q.trap.jp/api/v3/webhooks/${id}`
    let headers = { 'Content-Type': 'text/plain' }
    if (secret !== '-1') {
      headers['X-TRAQ-Signature'] = calcHMACSHA1(message, secret)
    }
    if (channelId !== '-1') {
      headers['X-TRAQ-Channel-Id'] = channelId
    }
    fetch(url, {
      method: 'POST',
      body: message,
      headers
    })
  }
} catch (err) {
  core.setFailed(err.message)
}
