const makeMessage = context => {
  let message = null
  const payload = context.payload

  core.debug(JSON.stringify(context, null, 2))
  core.debug("------------------------- ")
  core.debug(JSON.stringify(payload, null, 2))

  if (context.eventName === 'issues' && payload.action === 'opened') {
    const issue = payload.issue
    message = [
      `## :git_issue_opened: [${issue.title}](${issue.html_url})が作成されました`,
      `**リポジトリ**: ${payload.repository.name}`,
      `**作成者**: ${context.actor}`,
      ...(issue.body.length === 0 ? [] : ['', '---', issue.body])
    ].join('\n')
  } else if (context.eventName === 'issues' && payload.action === 'closed') {
    const issue = payload.issue
    message = [
      `## :git_issue_closed: [${issue.title}](${issue.html_url})が閉じられました`,
      `**リポジトリ**: ${payload.repository.name}`,
      `**作成者**: ${context.actor}`,
      ...(issue.body.length === 0 ? [] : ['', '---', issue.body])
    ].join('\n')
  } else if (context.eventName === 'issue_comment' && payload.action === 'created') {
    const issue = payload.issue
    if (!('pull_request' in issue)) {
      message = [
        `## :comment: issue [${issue.title}](${issue.html_url}) にコメントが追加されました`,
        `**リポジトリ**: ${payload.repository.name}`,
        `**コメントした人**: ${context.actor}`,
        ...(payload.comment.body.length === 0 ? [] : ['', '---', payload.comment.body])
      ].join('\n')
    } else {
      message = [
        `## :blobenjoy: PR[${issue.title}](${issue.html_url}) にコメントが追加されました`,
        `**リポジトリ**: ${payload.repository.name}`,
        `**コメントした人**: ${context.actor}`,
        ...(payload.comment.body.length === 0 ? [] : ['', '---', payload.comment.body])
      ].join('\n')
    }
  } else if (context.eventName === 'pull_request' && payload.action === 'opened') {
    const pr = payload.pull_request
    console.log('is pr')
    console.log(pr)
    message = [
      `## :git_pull_request: [${pr.title}](${pr.html_url}) が作成されました`,
      `**リポジトリ**: ${payload.repository.name}`,
      `**作成者**: ${context.actor}`,
      ...(pr.body.length === 0 ? []: ['', '---', pr.body])
    ].join('\n')
  } else if (context.eventName === 'pull_request' && payload.action === 'closed') {
    const pr = payload.pull_request
    if (pr.merged) {
      message = [
        `## :git_merged: [${pr.title}](${pr.html_url}) がマージされました :tada:`,
        `**リポジトリ**: ${payload.repository.name}`,
        `**作成者**: ${context.actor}`,
        ...(pr.body.length === 0 ? [] : ['', '---', pr.body])
      ].join('\n')
    } else {
      message = [
        `## :git_pull_request_closed: [${pr.title}](${pr.html_url}) が閉じられました`,
        `**リポジトリ**: ${payload.repository.name}`,
        `**作成者**: ${context.actor}`,
        ...(pr.body.length === 0 ? [] : ['', '---', pr.body])
      ].join('\n')
    }
  } else if (context.eventName === 'pull_request' && payload.action === 'review_requested') {
    const pr = payload.pull_request
    message = [
      `## :blob_bongo: PR[${pr.title}](${pr.html_url}) でレビューがリクエストされました`,
      `**リポジトリ**: ${payload.repository.name}`,
      `**リクエストされた人**: ${payload.requested_reviewer.login}`
    ].join('\n')
  } else if (context.eventName === 'pull_request_review' && payload.action === 'submitted') {
    const pr = payload.pull_request
    if (payload.review.state === 'approved') {
      message = [
        `## :partyparrot_blob_cat: PR[${pr.title}](${pr.html_url}) が approve されました`,
        `**リポジトリ**: ${payload.repository.name}`,
        `**approve した人**: ${payload.review.user.login}`,
        ...(payload.review.body.length === 0 ? [] : ['', '---', payload.review.body])
      ].join('\n')
    } else if (payload.review.state === 'changes_requested') {
      message = [
        `## :Hyperblob: PR[${pr.title}](${pr.html_url}) で変更がリクエストされました`,
        `**リポジトリ**: ${payload.repository.name}`,
        `**リクエストした人**: ${payload.review.user.login}`,
        ...(payload.review.body.length === 0 ? [] : ['', '---', payload.review.body])
      ].join('\n')
    } else {
      message = [
        `## :blobwobwork: PR[${pr.title}](${pr.html_url}) にレビューコメントが追加されました`,
        `**リポジトリ**: ${payload.repository.name}`,
        `**コメントした人**: ${payload.review.user.login}`,
        ...(payload.review.body === null || payload.review.body.length === 0 ? [] : ['', '---', payload.review.body])
      ].join('\n')
    }
  }
  return message
}
module.exports = makeMessage;
