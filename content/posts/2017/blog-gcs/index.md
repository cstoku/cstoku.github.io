---
title: GCPのバックエンドバケットを使用してブログの環境を構築してみた

date: 2017-01-02T23:23:12+09:00
draft: false

tags:
- gcp
- gcs

resources:
- name: thumbnail
  src: header.jpg
- name: arch
  src: blog-arch.jpg

---

# はじめに

ここ最近、GCPを集中的に学んでいて、バックエンドバケットという機能があるのを知り、
どうにかして活用してみたいな〜。

ということで、このブログをバックエンドバケットを使ってサイトを公開する環境を作ってみました。

# 構成

ブログの環境を構築するにあたって

- GCP
    - Cloud Storage
    - Cloud Load Balancing
    - Cloud CDN
    - Cloud DNS
- GitHub
- CircleCI

のサービスを使用しています。以下、構成図です。

{{< img name="arch" >}}

まぁ、パッと見はよくある構成ですね。

各サービスについて詳しく見ていきます。

## Google Cloud Storage

今回の肝その1です。とはいっても

- バケットの作成
- デフォルト権限でallUsersにRead権限の付与
- ファイルのアップロード

をするだけです。
コマンドではこんな感じでやってます。

```sh
gsutil mb gs://bucket-name/
gsutil defacl ch -u AllUsers:R gs://bucket-name
gsutil -m rsync -d -r public/ gs://bucket-name/
```

## Google Cloud Load Balancing

今回の肝その2です。

HTTP(S)負荷分散の設定を行い、バックエンドバケットで先ほど作成したバケットを指定します。

詳細設定で行くと

- グローバル転送ルール
- ターゲットプロキシ
- バックエンドバケット

の設定をしています。

普段ではバックエンドサービスを指定してインスタンスグループにバランシングを行うと思いますが、
今回はバックエンドバケットを選択して静的なコンテンツをGCSから配信するように設定しています。

ついでに証明書の設定も行い、SSL対応もしています。さらに、証明書の設定をすることでHTTP2対応もされます。
美味しい。素晴らしい。

## Google Cloud CDN

バックエンドバケットを設定する際に「Cloud CDNを有効にする」にチェックを入れることでCDNが使えるようになります。

それだけ。

## Google Cloud DNS

名前解決はCloud DNSに任せます。

AレコードでLBのIPを登録するだけです。

## GitHub

ソースコードは[GitHub](https://github.com/cstoku/cstoku.github.io)においています。

GitHub Pagesの名残でUser Pagesのリポジトリになっていますが。
CNAMEにCloud DNSで登録したドメインを記述しておくことでGitHub Pages用のドメインでアクセス来た場合も
LBにリダイレクトされます。

(Warningのメールがめっちゃ飛んで来るけど・・・。)

ついでに静的サイトジェネレータは[Hugo](https://gohugo.io/)を使っています。

## CircleCI

ただただPushをフックしてデプロイしてくれるだけです。

やってることは`hugo`でジェネレートして`gsutil rsync`でファイルを送りつけています。


# 最後に

ざっとですが、バックエンドバケットを使った静的サイト(ブログ)の構築について紹介しました。

最初はバックエンドバケット使ってLB+GCS+HTTPS化で構築だ！とか思ってたのですが、ついでにCDNとHTTP2化も
できてしまいました。便利便利。

とはいえバックエンドバケットはアルファ版リリースなので変更とかあるとサイトが死んでしまいますけどね。そのためにGCSでホスティングかGitHub Pagesに戻せるようにしています。

AWSに比べればまだ機能が少ないですが、安いしGCPのほうが性能がよかったりするので、GCPオススメです。

個人的に気になるサービスがまだまだあるのでガンガン習得していきたいですねー。
それでは！

