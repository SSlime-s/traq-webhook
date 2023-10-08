# traq-webhook
traQ に github actions +  webhook を用いて投稿するようのやつ
## 入力
### `webhook-id`
**必須** Webhook の ID
### `webhook-secret`
Webhook の Secret (Secure Webhookの場合必須)
### `channel-id`
投稿先のチャンネル (入力しなければデフォルトのチャンネル)

### `message`
投稿するメッセージ (入力しなければ自動生成されます)

## 使用例
```
on:
  issues:
    types: [opened, edited, closed, reopened]
  issue_comment:
    types: [created, edited]
  pull_request:
    types: [opened, edited, closed, review_requested]
  pull_request_review:
    types: [submitted]
  release:
    types: [released]
  create

permissions: read-all

jobs:
  webhook:
    runs-on: ubuntu-latest
    steps:
    - name: post to traQ
      uses: SSlime-s/traq-webhook@v4.15
      with:
        webhook-id: ${{ secrets.WEBHOOK_ID }}
        webhook-secret: ${{ secrets.WEBHOOK_SECRET }}
```
