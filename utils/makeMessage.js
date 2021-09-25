// HACK: https://... ではなく //... だと OGP がでない
const createMdLink = (text, link, ogp = false) => `[${text}](${ogp ? link : link.replace(/^https?:/, '')})`
// PR も format が同じなので PR のリンクも作れる
const createIssueLink = (issue, ogp = false) => createMdLink(issue.title, issue.html_url || issue.url, ogp)
const createRepoLink = (repo, ogp = false) => createMdLink(repo.name, repo.html_url, ogp)
const createUserLink = (user, ogp = false) => createMdLink(user.login, user.html_url, ogp)

const makeMessage = (core, context) => {
  let message = null
  const payload = context.payload

  core.debug(JSON.stringify(context, null, 2))

  if (context.eventName === 'issues') {
    const issue = payload.issue
    if (payload.action === 'opened') {
      message = [
        `## :git_issue_opened: ${createIssueLink(issue, true)}が作成されました`,
        `**リポジトリ**: ${createRepoLink(payload.repository)}`,
        `**作成者**: ${createUserLink(payload.sender)}`,
        ...(issue.body.length === 0 ? [] : ['', '---', issue.body])
      ].join('\n')
    } else if (payload.action === 'edited') {
      message = [
        `## :pencil: issue ${createIssueLink(issue, true)}が編集されました`,
        `**リポジトリ**: ${createRepoLink(payload.repository)}`,
        `**編集者**: ${createUserLink(payload.sender)}`,
        ...(issue.body.length === 0 ? [] : ['', '---', issue.body])
      ].join('\n')
    } else if (payload.action === 'closed') {
      message = [
        `## :git_issue_closed: ${createIssueLink(issue, true)}が閉じられました`,
        `**リポジトリ**: ${createRepoLink(payload.repository)}`,
        `**閉じた人**: ${createUserLink(payload.sender)}`,
        ...(issue.body.length === 0 ? [] : ['', '---', issue.body])
      ].join('\n')
    } else if (payload.action === 'reopened') {
      message = [
        `## :git_issue_opened: ${createIssueLink(issue, true)}が再び開かれました`,
        `**リポジトリ**: ${createRepoLink(payload.repository)}`,
        `**開いた人**: ${createUserLink(issue.user)}`,
        ...(issue.body.length === 0 ? [] : ['', '---', issue.body])
      ].join('\n')
    }
  }

  else if (context.eventName === 'issue_comment') {
    const issue = payload.issue
    const comment = payload.comment
    // issue_comment は pull_request のコメントでもトリガーされるので分ける
    if ('pull_request' in issue) {
      if (payload.action === 'created') {
        message = [
          `## :blobenjoy: PR ${createIssueLink(issue, true)} にコメントが追加されました`,
          `**リポジトリ**: ${createRepoLink(payload.repository)}`,
          `**コメントした人**: ${createUserLink(comment.user)}`,
          ...(comment.body.length === 0 ? [] : ['', '---', payload.comment.body])
        ].join('\n')
      } else if (payload.action === 'edited') {
        message = [
          `## :blobenjoy: PR ${createIssueLink(issue, true)} のコメントが編集されました`,
          `**リポジトリ**: ${createRepoLink(payload.repository)}`,
          `**編集者**: ${createUserLink(comment.user)}`,
          ...(comment.body.length === 0 ? [] : ['', '---', payload.comment.body])
        ].join('\n')
      }
    } else {
      if (payload.action === 'created') {
        message = [
          `## :comment: issue ${createIssueLink(issue, true)} にコメントが追加されました`,
          `**リポジトリ**: ${createRepoLink(payload.repository)}`,
          `**コメントした人**: ${createUserLink(comment.user)}`,
          ...(comment.body.length === 0 ? [] : ['', '---', payload.comment.body])
        ].join('\n')
      } else if (payload.action === 'edited') {
        message = [
          `## :comment: issue ${createIssueLink(issue, true)} のコメントが編集されました`,
          `**リポジトリ**: ${createRepoLink(payload.repository)}`,
          `**編集者**: ${createUserLink(comment.user)}`,
          ...(comment.body.length === 0 ? [] : ['', '---', payload.comment.body])
        ].join('\n')
      }
    }
  }

  else if (context.eventName === 'pull_request') {
    const pr = payload.pull_request
    if (payload.action === 'opened') {
      message = [
        `## :git_pull_request: PR ${createIssueLink(pr, true)} が作成されました`,
        `**リポジトリ**: ${createRepoLink(payload.repository)}`,
        `**作成者**: ${createUserLink(payload.sender)}`,
        ...(pr.body.length === 0 ? []: ['', '---', pr.body])
      ].join('\n')
    } else if (payload.action === 'edited') {
      message = [
        `## :git_pull_request: PR ${createIssueLink(pr, true)} が編集されました`,
        `**リポジトリ**: ${createRepoLink(payload.repository)}`,
        `**編集者**: ${createUserLink(payload.sender)}`,
        ...(pr.body.length === 0 ? []: ['', '---', pr.body])
      ].join('\n')
    } else if (payload.action === 'closed') {
      if (pr.merged) {
        message = [
          `## :git_merged: PR ${createIssueLink(pr, true)} がマージされました :tada:`,
          `**リポジトリ**: ${createRepoLink(payload.repository)}`,
          `**マージした人**: ${createUserLink(payload.sender)}`,
          ...(pr.body.length === 0 ? [] : ['', '---', pr.body])
        ].join('\n')
      } else {
        message = [
          `## :git_pull_request_closed: PR ${createIssueLink(pr, true)} が閉じられました`,
          `**リポジトリ**: ${createRepoLink(payload.repository)}`,
          `**閉じた人**: ${createUserLink(payload.sender)}`,
          ...(pr.body.length === 0 ? [] : ['', '---', pr.body])
        ].join('\n')
      }
    } else if (payload.action === 'review_requested') {
      message = [
        `## :blob_bongo: PR ${createIssueLink(pr, true)} でレビューがリクエストされました`,
        `**リポジトリ**: ${createRepoLink(payload.repository)}`,
        `**リクエストされた人**: ${createUserLink(payload.requested_reviewer)}`
      ].join('\n')
    }
  }

  else if (context.eventName === 'pull_request_review') {
    const pr = payload.pull_request
    if (payload.action === 'submitted') {
      if (payload.review.state === 'approved') {
        message = [
          `## :partyparrot_blob_cat: PR ${createIssueLink(pr, true)} が approve されました`,
          `**リポジトリ**: ${createRepoLink(payload.repository)}`,
          `**approve した人**: ${createUserLink(payload.review.user)}`,
          ...(payload.review.body.length === 0 ? [] : ['', '---', payload.review.body])
        ].join('\n')
      } else if (payload.review.state === 'changes_requested') {
        message = [
          `## :Hyperblob: PR ${createIssueLink(pr, true)} で変更がリクエストされました`,
          `**リポジトリ**: ${createRepoLink(payload.repository)}`,
          `**リクエストした人**: ${createUserLink(payload.review.user)}`,
          ...(payload.review.body.length === 0 ? [] : ['', '---', payload.review.body])
        ].join('\n')
      } else {
        message = [
          `## :blobwobwork: PR ${createIssueLink(pr, true)} にレビューコメントが追加されました`,
          `**リポジトリ**: ${createRepoLink(payload.repository)}`,
          `**コメントした人**: ${createUserLink(payload.review.user)}`,
          ...(payload.review.body === null || payload.review.body.length === 0 ? [] : ['', '---', payload.review.body])
        ].join('\n')
      }
    }
  }

  else if (context.eventName === 'release') {
    const release = payload.release
    if (payload.action === 'released') {
      message = [
        `## :tada.large: [${release.name || release.tag_name}](${release.html_url}) がリリースされました`,
        `**リポジトリ**: ${createRepoLink(payload.repository)}`,
      ].join('\n')
    }
  }

  return message
}
module.exports = makeMessage;
