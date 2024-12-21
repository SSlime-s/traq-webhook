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
投稿するメッセージ (`auto-generate-message` が true の場合は無視されます)

`auto-generate-message` が false もしくは未指定の場合は必須です

### `auto-generate-message`
true にすると自動生成されたメッセージを投稿します (`message` は無視されます)

### `embed`
true にすると埋め込みが有効になります

## 使用例
### メッセージの自動生成を利用する場合
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
      uses: SSlime-s/traq-webhook@v5
      with:
        webhook-id: ${{ secrets.WEBHOOK_ID }}
        webhook-secret: ${{ secrets.WEBHOOK_SECRET }}
        auto-generate-message: true
```

### メッセージを指定する場合
```
on:
  your-event

jobs:
  webhook:
    runs-on: ubuntu-latest
    steps:
    - name: post to traQ
      uses: SSlime-s/traq-webhook@v5
      with:
        webhook-id: ${{ secrets.WEBHOOK_ID }}
        webhook-secret: ${{ secrets.WEBHOOK_SECRET }}
        message: 'Hello, world!'
        embed: true
```
