const core = require('@actions/core')
const github = require('@actions/github')
const crypto = require('crypto')
const fetch = require('node-fetch')

const calcHMACSHA1 = (message, secret) => crypto.createHmac('sha1', secret).update(message).digest('hex')

try {
  const id = core.getInput('webhook-id')
  const secret = core.getInput('webhook-secret', { required: false })
  // const content = core.getInput('content')
  const channelId = core.getInput('channel-id', { required: false })

  let content = null
  const context = github.context
  const payload = github.context.payload
  console.log(payload)
  if (context.eventName === 'issues' && payload.action === 'opened') {
    const issue = payload.issue
    content = [
      `## :git_issue_opened: [${issue.title}](${issue.html_url})が作成されました`,
      `リポジトリ: ${payload.repository.name}`,
      `作成者: ${context.actor}`,
      ...(issue.body.length === 0 ? [] : ['---', issue.body])
    ].join('\n')
  } else if (context.eventName === 'issues' && payload.action === 'closed') {
    const issue = payload.issue
    content = [
      `## :git_issue_closed: [${issue.title}](${issue.html_url})が閉じられました`,
      `リポジトリ: ${payload.repository.name}`,
      `作成者: ${context.actor}`,
      ...(issue.body.length === 0 ? [] : ['---', issue.body])
    ].join('\n')
  } else if (context.eventName === 'issue_comment' && payload.action === 'created') {
    const issue = payload.issue
    content = [
      `## :comment: [${issue.title}](${issue.html_url}) にコメントが追加されました`,
      `リポジトリ: ${payload.repository.name}`,
      `コメントした人: ${context.actor}`
    ].join('\n')
  } else if (context.eventName === 'pull_request' && payload.action === 'opened') {
    const pr = payload.pull_request
    content = [
      `## :git_pull_request: [${pr.title}](${pr.html_url}) が作成されました`,
      `リポジトリ: ${payload.repository.name}`,
      `作成者: ${context.actor}`,
      ...calcHMACSHA1(pr.body.length === 0 ? []: ['---', pr.body])
    ].join('\n')
  } else if (context.eventName === 'pull_request' && payload.action === 'closed') {
    const pr = payload.pull_request
    content = [
      `## :git_pull_request_closed: [${pr.title}](${pr.html_url}) がマージされました :tada:`,
      `リポジトリ: ${payload.repository.name}`,
      `作成者: ${context.actor}`,
      ...calcHMACSHA1(pr.body.length === 0 ? []: ['---', pr.body])
    ].join('\n')
  } else if (context.eventName === 'pull_request' && payload.action === 'review_requested') {
    // TODO リクエストされた人をだす
    const pr = payload.pull_request
    content = [
      `## :eyes_wave: [${pr.title}](${pr.html_url}) でレビューがリクエストされました`,
      `リポジトリ: ${context.actor}`
    ].join('\n')
  } else if (context.eventName === 'pull_request_review' && payload.action === 'submmitted') {
    const pr = payload.pull_request
    content = [
      `## :blob_slide: [${pr.title}](${pr.html_url}) にコメントが追加されました`,
      `リポジトリ: ${payload.repository.name}`,
      `追加した人: ${context.actor}`
    ].join('\n')
  } else {
    return
  }

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
