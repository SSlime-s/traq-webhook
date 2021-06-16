/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 827:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 764:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 76:
/***/ ((module) => {

module.exports = eval("require")("node-fetch");


/***/ }),

/***/ 417:
/***/ ((module) => {

"use strict";
module.exports = require("crypto");;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const core = __nccwpck_require__(827)
const github = __nccwpck_require__(764)
const crypto = __nccwpck_require__(417)
const fetch = __nccwpck_require__(76)

const calcHMACSHA1 = (message, secret) => crypto.createHmac('sha1', secret).update(message).digest('hex')

const makeMessage = context => {
  let content = null
  const payload = context.payload
  core.debug(JSON.stringify(context, null, 2))
  core.debug("------------------------- ")
  core.debug(JSON.stringify(payload, null, 2))
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
      `## :blob_bongo: PR[${pr.title}](${pr.html_url}) でレビューがリクエストされました`,
      `**リポジトリ**: ${payload.repository.name}`,
      `**リクエストされた人**: ${payload.requested_reviewer.login}`
    ].join('\n')
  } else if (context.eventName === 'pull_request_review' && payload.action === 'submitted') {
    const pr = payload.pull_request
    if (payload.review.state === 'approved') {
      content = [
        `## :partyparrot_blob_cat: PR[${pr.title}](${pr.html_url}) が approve されました`,
        `**リポジトリ**: ${payload.repository.name}`,
        `**approve した人**: ${payload.review.user.login}`,
        ...(payload.review.body.length === 0 ? [] : ['', '---', payload.review.body])
      ].join('\n')
    } else if (payload.review.state === 'changes_requested') {
      content = [
        `## :Hyperblob: PR[${pr.title}](${pr.html_url}) で変更がリクエストされました`,
        `**リポジトリ**: ${payload.repository.name}`,
        `**リクエストした人**: ${payload.review.user.login}`,
        ...(payload.review.body.length === 0 ? [] : ['', '---', payload.review.body])
      ].join('\n')
    } else {
      content = [
        `## :blobwobwork: PR[${pr.title}](${pr.html_url}) がレビューされました`,
        `**リポジトリ**: ${payload.repository.name}`,
        `**レビューした人**: ${payload.review.user.login}`,
        ...(payload.review.body === null || payload.review.body.length === 0 ? [] : ['', '---', payload.review.body])
      ].join('\n')
    }
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

})();

module.exports = __webpack_exports__;
/******/ })()
;