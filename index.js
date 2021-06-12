const core = require('@actions/core')
const github = require('@actions/github')
const crypto = require('crypto')
const fetch = require('node-fetch')

const calcHMACSHA1 = (message, secret) => crypto.createHmac('sha1', secret).update(message).digest('hex')

try {
  const id = core.getInput('webhook-id')
  const secret = core.getInput('webhook-secret', { required: false })
  const content = core.getInput('content')
  const channelId = core.getInput('channel-id', { required: false })

  const url = `https://q.trap.jp/api/v3/webhooks/${id}`
  let headers = { 'Content-Type': 'text/plain' }
  if (secret !== '-1') {
    headers['X-TRAQ-Signature'] = calcHMACSHA1(content, secret)
  }
  if (channelId !== '-1') {
    headers['X-TRAQ-Channel-Id'] = channelId
  }
  console.log(headers)
  fetch(url, {
    method: 'POST',
    body: content,
    headers
  })
} catch (err) {
  core.setFailed(err.message)
}