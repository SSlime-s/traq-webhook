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
  core.debug("------------------------- ")
  core.debug(JSON.stringify(payload, null, 2))

  if (context.eventName === 'issues') {
    const issue = payload.issue
    if (payload.action === 'opened') {
      message = [
        `## :git_issue_opened: ${createIssueLink(issue)}が作成されました`,
        `**リポジトリ**: ${createRepoLink(payload.repository, false)}`,
        `**作成者**: ${createUserLink(issue.user, false)}`,
        ...(issue.body.length === 0 ? [] : ['', '---', issue.body])
      ].join('\n')
    } else if (payload.action === 'edited') {
      message = [
        `## :pencil: issue ${createIssueLink(issue)}が編集されました`,
        `**リポジトリ**: ${createRepoLink(payload.repository, false)}`,
        `**編集者**: ${createUserLink(issue.user, false)}`,
        ...(issue.body.length === 0 ? [] : ['', '---', issue.body])
      ].join('\n')
    } else if (payload.action === 'closed') {
      message = [
        `## :git_issue_closed: ${createIssueLink(issue)}が閉じられました`,
        `**リポジトリ**: ${createRepoLink(payload.repository, false)}`,
        `**閉じた人**: ${createUserLink(issue.user, false)}`,
        ...(issue.body.length === 0 ? [] : ['', '---', issue.body])
      ].join('\n')
    } else if (payload.action === 'reopened') {
      message = [
        `## :git_issue_opened: ${createIssueLink(issue)}が再び開かれました`,
        `**リポジトリ**: ${createRepoLink(payload.repository, false)}`,
        `**開いた人**: ${createUserLink(issue.user, false)}`,
        ...(issue.body.length === 0 ? [] : ['', '---', issue.body])
      ].join('\n')
    }
  }

  else if (context.eventName === 'issue_comment') {
    const issue = payload.issue
    // issue_comment は pull_request のコメントでもトリガーされるので分ける
    if ('pull_request' in issue) {
      if (payload.action === 'created') {
        message = [
          `## :blobenjoy: PR ${createIssueLink(issue)} にコメントが追加されました`,
          `**リポジトリ**: ${createRepoLink(payload.repository, false)}`,
          `**コメントした人**: ${createUserLink(issue.user, false)}`,
          ...(payload.comment.body.length === 0 ? [] : ['', '---', payload.comment.body])
        ].join('\n')
      } else if (payload.action === 'edited') {
        message = [
          `## :blobenjoy: PR ${createIssueLink(issue)} のコメントが編集されました`,
          `**リポジトリ**: ${createRepoLink(payload.repository, false)}`,
          `**編集者**: ${createUserLink(issue.user, false)}`,
          ...(payload.comment.body.length === 0 ? [] : ['', '---', payload.comment.body])
        ].join('\n')
      }
    } else {
      if (payload.action === 'created') {
        message = [
          `## :comment: issue ${createIssueLink(issue)} にコメントが追加されました`,
          `**リポジトリ**: ${createRepoLink(payload.repository, false)}`,
          `**コメントした人**: ${createUserLink(issue.user, false)}`,
          ...(payload.comment.body.length === 0 ? [] : ['', '---', payload.comment.body])
        ].join('\n')
      } else if (payload.action === 'edited') {
        message = [
          `## :comment: issue ${createIssueLink(issue)} のコメントが編集されました`,
          `**リポジトリ**: ${createRepoLink(payload.repository, false)}`,
          `**編集者**: ${createUserLink(issue.user, false)}`,
          ...(payload.comment.body.length === 0 ? [] : ['', '---', payload.comment.body])
        ].join('\n')
      }
    }
  }

  else if (context.eventName === 'pull_request') {
    const pr = payload.pull_request
    if (payload.action === 'opened') {
      message = [
        `## :git_pull_request: PR ${createIssueLink(pr)} が作成されました`,
        `**リポジトリ**: ${createRepoLink(payload.repository, false)}`,
        `**作成者**: ${createUserLink(payload.user, false)}`,
        ...(pr.body.length === 0 ? []: ['', '---', pr.body])
      ].join('\n')
    } else if (body.action === 'edited') {
      message = [
        `## :git_pull_request: PR ${createIssueLink(pr)} が編集されました`,
        `**リポジトリ**: ${createRepoLink(payload.repository, false)}`,
        `**編集者**: ${createUserLink(payload.user, false)}`,
        ...(pr.body.length === 0 ? []: ['', '---', pr.body])
      ].join('\n')
    } else if (body.action === 'closed') {
      if (pr.merged) {
        message = [
          `## :git_merged: PR ${createIssueLink(pr)} がマージされました :tada:`,
          `**リポジトリ**: ${createRepoLink(payload.repository, false)}`,
          `**マージした人**: ${createUserLink(payload.user, false)}`,
          ...(pr.body.length === 0 ? [] : ['', '---', pr.body])
        ].join('\n')
      } else {
        message = [
          `## :git_pull_request_closed: PR ${createIssueLink(pr)} が閉じられました`,
          `**リポジトリ**: ${createRepoLink(payload.repository, false)}`,
          `**閉じた人**: ${createUserLink(payload.user, false)}`,
          ...(pr.body.length === 0 ? [] : ['', '---', pr.body])
        ].join('\n')
      }
    } else if (payload.action === 'review_requested') {
      message = [
        `## :blob_bongo: PR ${createIssueLink(pr)} でレビューがリクエストされました`,
        `**リポジトリ**: ${createRepoLink(payload.repository, false)}`,
        `**リクエストされた人**: ${createdUserLink(payload.requested_reviewer, false)}`
      ].join('\n')
    }
  }

  else if (context.eventName === 'pull_request_review') {
    const pr = payload.pull_request
    if (payload.action === 'submitted') {
      if (payload.review.state === 'approved') {
        message = [
          `## :partyparrot_blob_cat: PR ${createIssueLink(pr)} が approve されました`,
          `**リポジトリ**: ${createRepoLink(payload.repository, false)}`,
          `**approve した人**: ${craeteUserLink(payload.review.user, false)}`,
          ...(payload.review.body.length === 0 ? [] : ['', '---', payload.review.body])
        ].join('\n')
      } else if (payload.review.state === 'changes_requested') {
        message = [
          `## :Hyperblob: PR ${createIssueLink(pr)} で変更がリクエストされました`,
          `**リポジトリ**: ${createRepoLink(payload.repository, false)}`,
          `**リクエストした人**: ${craeteUserLink(payload.review.user, false)}`,
          ...(payload.review.body.length === 0 ? [] : ['', '---', payload.review.body])
        ].join('\n')
      } else {
        message = [
          `## :blobwobwork: PR ${createIssueLink(pr)} にレビューコメントが追加されました`,
          `**リポジトリ**: ${createRepoLink(payload.repository, false)}`,
          `**コメントした人**: ${craeteUserLink(payload.review.user, false)}`,
          ...(payload.review.body === null || payload.review.body.length === 0 ? [] : ['', '---', payload.review.body])
        ].join('\n')
      }
    }
  }

  return message
}
module.exports = makeMessage;
