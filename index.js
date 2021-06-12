const core = require('@actions/core')
const github = require('@actions/github')
const crypto = require('crypto')
const fetch = require('node-fetch')

const calcHMACSHA1 = (message, secret) => crypto.createHmac('sha1', secret).update(message).digest('hex')

const makeMessage = context => {
  let content = null
  const payload = context.payload
  console.log(context)
  console.log("-------------------------")
  console.log(payload)
  if (context.eventName === 'issues' && payload.action === 'opened') {
    const issue = payload.issue
    content = [
      `## :git_issue_opened: [${issue.title}](${issue.html_url})が作成されました`,
      `**リポジトリ**: ${payload.repository.name}`,
      `**作成者**: ${context.actor}`,
      ...(issue.body.length === 0 ? [] : ['', '---', issue.body])
    ].join('\n')
  } else if (context.eventName === 'issues' && payload.action === 'closed') {
    const issue = payload.issue
    content = [
      `## :git_issue_closed: [${issue.title}](${issue.html_url})が閉じられました`,
      `**リポジトリ**: ${payload.repository.name}`,
      `**作成者**: ${context.actor}`,
      ...(issue.body.length === 0 ? [] : ['', '---', issue.body])
    ].join('\n')
  } else if (context.eventName === 'issue_comment' && payload.action === 'created') {
    const issue = payload.issue
    if (!('pull_request' in issue)) {
      content = [
        `## :comment: issue [${issue.title}](${issue.html_url}) にコメントが追加されました`,
        `**リポジトリ**: ${payload.repository.name}`,
        `**コメントした人**: ${context.actor}`,
        ...(payload.comment.body.length === 0 ? [] : ['', '---', payload.comment.body])
      ].join('\n')
    } else {
      content = [
        `## :blob_enjoy: PR[${issue.title}](${issue.html_url}) にレビューコメントが追加されました`,
        `**リポジトリ**: ${payload.repository.name}`,
        `**追加した人**: ${context.actor}`,
        ...(payload.comment.body.length === 0 ? [] : ['', '---', payload.comment.body])
      ].join('\n')
    }
  } else if (context.eventName === 'pull_request' && payload.action === 'opened') {
    const pr = payload.pull_request
    console.log('is pr')
    console.log(pr)
    content = [
      `## :git_pull_request: [${pr.title}](${pr.html_url}) が作成されました`,
      `**リポジトリ**: ${payload.repository.name}`,
      `**作成者**: ${context.actor}`,
      ...(pr.body.length === 0 ? []: ['', '---', pr.body])
    ].join('\n')
  } else if (context.eventName === 'pull_request' && payload.action === 'closed') {
    const pr = payload.pull_request
    if (pr.merged) {
      content = [
        `## :git_merged: [${pr.title}](${pr.html_url}) がマージされました :tada:`,
        `**リポジトリ**: ${payload.repository.name}`,
        `**作成者**: ${context.actor}`,
        ...(pr.body.length === 0 ? [] : ['', '---', pr.body])
      ].join('\n')
    } else {
      content = [
        `## :git_pull_request_closed: [${pr.title}](${pr.html_url}) が閉じられました`,
        `**リポジトリ**: ${payload.repository.name}`,
        `**作成者**: ${context.actor}`,
        ...(pr.body.length === 0 ? [] : ['', '---', pr.body])
      ].join('\n')
    }
  } else if (context.eventName === 'pull_request' && payload.action === 'review_requested') {
    const pr = payload.pull_request
    content = [
      `## :eyes_wave: PR[${pr.title}](${pr.html_url}) でレビューがリクエストされました`,
      `**リポジトリ**: ${payload.repository.name}`,
      `**リクエストされた人**: ${payload.requested_reviewer.login}`
    ].join('\n')
  } else if (context.eventName === 'pull_request_review' && payload.action === 'submmitted') {
    const pr = payload.pull_request
    content = [
      `## :blob_slide: PR[${pr.title}](${pr.html_url}) がレビューされました`,
      `**リポジトリ**: ${payload.repository.name}`,
      `**レビューした人**: ${context.actor}`
    ].join('\n')
  }
  return content
}

try {
  const id = core.getInput('webhook-id')
  const secret = core.getInput('webhook-secret', { required: false })
  const channelId = core.getInput('channel-id', { required: false })

  const context = github.context
  const content = makeMessage(context)

  if (typeof content === 'string') {
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
  }
} catch (err) {
  core.setFailed(err.message)
}
