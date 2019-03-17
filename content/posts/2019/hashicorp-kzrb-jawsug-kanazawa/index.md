---
title: 「HashiCorp Terraform & Vault Enterprise 勉強会 in 金沢」に行ってきた

date: 2019-03-17T13:34:00+09:00

tags:
- hashicorp
- terraform
- vault
- kzrb
- jawsug

resources:
- name: thumbnail
  src: header.jpg
- name: img1
  src: img1.jpg
- name: img2
  src: img2.jpg
- name: img3
  src: img3.jpg
- name: img4
  src: img4.jpg

---

# 参加の経緯

「[HashiCorp Terraform & Vault Enterprise 勉強会 in 金沢](https://connpass.com/event/120462/)」に参加してきた。

Vaultの話が聞ける！！と思ってポチったら金沢だった。っていう落ちなのだけど。

北陸というか石川県に行ったことなかったし、ついでにウロウロしてこようっていう感じで観光含め行ってきた。

勉強会での記録とメモ。

## その前に・・・

東京から新幹線で行ったのですが、3時間位あったのでVaultの機能について、
調べてから少し時間が立ってたのでキャッチアップするために `Learn` のページを読み進めていた。
(というかかなり読み飛ばしは多いが読み終わらせてしまった)

そしたらなんと、勉強会で出てきたVaultの話は割とそれに沿った内容だった。(それもそうか。)
勉強会中にもあったが、 `Learn` のページとドキュメント自体がかなりよくまとまっているためそれ読めば大丈夫。

そんな中でも興味のある話がいくつかあったのでそれをこちらでメモ、共有しようと思う。

ついでにタイトルに有るもう一つのTerraformについては業務でも個人的にもそれなりに書いているので、気になったところ以外は特に触れない。

# 学び

## 得た情報

- Encryption as a Service(EaaS)なるTransitというSecret Engineが増えて
    - Vaultにencrypt/decryptを依頼する機能
    - Encryption keyのrotationも簡単そう
- 上のTransit Secret Engineの話か忘れたが、Vault Enterpriseを載せた5台のマシンで10万rpsでるらしい
- `Learn` のページが便利。
    - terraform: https://learn.hashicorp.com/terraform/
    - vault: https://learn.hashicorp.com/vault/
- VaultはOSS版だとActive/Standby構成まで。
    - Vault Enterprise ProでDR構成が作れる
    - Vault Enterprise PremiumでPerformance Replicationを使ったDR構成が作れる
- おすすめページ
    - [Vault Reference Architecture](https://learn.hashicorp.com/vault/operations/ops-reference-architecture): Vaultのおすすめ構成たち
    - [Production Hardening](https://learn.hashicorp.com/vault/operations/production-hardening): Productionで構成/運用する際に行うべき設定/確認事項
    - [Auth Methods](https://www.vaultproject.io/docs/auth/index.html): Authenticationで使えるIdPの種類
    - [Secrets Engines](https://www.vaultproject.io/docs/secrets/index.html): 利用できるSecret Engineの一覧
    - [storage Stanza](https://www.vaultproject.io/docs/configuration/storage/index.html): VaultのBackendのStorageとして利用できるものの一覧
- Vault Agent
    - 認証処理の委譲やCachingができる
    - [Vault Agent Auto-Auth](https://www.vaultproject.io/docs/agent/autoauth/index.html)
    - [Vault Agent Caching](https://www.vaultproject.io/docs/agent/caching/index.html)
    - [Vault Agent with Kubernetes](https://learn.hashicorp.com/vault/identity-access-management/vault-agent-k8s)コンテナのSidecarとして利用する方法: 
- 活用事例
    - [Vault & Adobe: Security at scale in a hybrid cloud environment](https://www.hashicorp.com/resources/hashicorp-vault-adobe-tackling-security-scale-hybrid-cloud)
- HashicorpのBlog
    - [HashiCorp Blog](https://www.hashicorp.com/blog)
    - [HashiCorp HashiBlog - Medium](https://medium.com/hashicorp-engineering)
- KubernetesにVaultをあまり置かないほうがいいらしい？
    - なるべく生な状態のところにおいたほうがいいらしい(コンテナやVMじゃなく物理な感じのところ)
    - k8s上に置こうとすると、k8s自体の証明書どうしようか、という話になる
    - 個人的にはVaultのTLSやらせるときの証明書もどうしようか。という感じ

## 質問

#### Vaultで10万rpsさばけるって行ってたのはEnterpriseを使ったときの話？

Yes

#### DRなどのレプリを組んだとき、Backend Storageは別物として扱われる？

[このようなDR構成](https://learn.hashicorp.com/vault/operations/ops-reference-architecture#cross-region-disaster-recovery)。別RegionでそれぞれConsulクラスタが動いているように見えたため。

回答はNo。同一のConsulクラスタらしい。確かに[ここ](https://www.vaultproject.io/docs/enterprise/replication/index.html)みると設定の複製のみを行っているようだ。

(たまたま見つけたけど、DRだとPromoteされたときに再度認証する必要あるのか。)

#### tfstate壊れるときあるんだけど、Terraform Enterprise使っている場合どうすればいいの？

普通に `terraform state pull/push` を使ってくれ。

`backend` に `atlas` (terraform enterprise)あるんだからそりゃそうか。

#### Terraform Enterpriseで使用されるTerraformのバージョンってどうなってるの？

通常は最新が利用される。設定で昔のバージョンを指定することも可能。

## 疑問

- seal/unsealってあるけど、最初にunsealする以外で使うタイミングがよくわからないんだけど、いつだ・・？

これだけ質問し忘れた。
unsealの状態で操作する話ばかりで前々からこれの使い所がよくわからなかった。

予防線的な使い方するのかな・・？

# まとめ

この勉強会を機会にVaultについて再キャッチアップできたのと、色々知見・情報を得れて非常に良かった。

Credential StoreはVault一択だと思っているのでぜひ使っていきたい。

# ついでに観光。

とりあえずウロウロしてきたのでその写真でも乗っけとく。

{{< img name="img1" >}}

これ見ると金沢来たって感じする。

{{< img name="img2" >}}

時間やWelcome、ようこそなどなど水で文字がでてきてすごかった。

{{< img name="img3" >}}

観光地っぽい場所にも行っておこう、ということで金沢城に行ってきた。

{{< img name="img4" >}}

模型すごい。

あと地元でも有名らしい[麺屋 大河](https://tabelog.com/ishikawa/A1701/A170101/17007507/)っていうラーメン屋に行ってきた。
開店前から10人ちょっと並んでてびっくり。美味しかったです。

もし次があったら[のどぐろ塩Soba 麺屋大河](https://tabelog.com/ishikawa/A1701/A170101/17011443/)っていうほうにも行ってみたい。というかこっちに行きたかったんだけど日曜が休みだった:cry:

