---
title: Kubernetes道場 1日目 - Kubernetesの概要

date: 2018-11-05T01:50:03+09:00
draft: true

tags:
- kubernetes
- advent-calendar-2018
- kubernetes-dojo

resources:
- name: thumbnail
  src: header.jpg
- name: k8s-arch
  src: k8s-arch.jpg

---

Kubernetes道場 1日目の記事です。

今回はKubernetes道場についてと、1回目の内容でKubernetesの概要について。

# Kubernetes道場について

一つは自分の知識のOutput。
Kubernetes勉強したが、何もやってない凄いのでBlogにでも学んだ内容を書いていこうと思い、そのうちのネタの一つ。

もう一つは、今となっては日本語の文献がや書籍が多くなってたが、自分が学び始めようと思ったときは何から手を付けていいか全くわからない状態だった。
今から勉強する人たちの役に立てればと思う。

そんな感じ。

# Kubernetesとは？

Kubernetesはコンテナオーケストレーションプラットフォーム。
自動的なコンテナのデプロイ、スケーリング、管理などをやってくれる。

このKubernetesはGoogleが15年間の本番での実行経験([BorgやOmega](https://queue.acm.org/detail.cfm?id=2898444)のことですね)
を元に、コミュニティの経験とアイデアを組み合わせて開発されている。

[公式サイト](https://kubernetes.io/)

[Kubernetes - GitHub](https://github.com/kubernetes)

現在は[Cloud Native Computing Foundation](https://www.cncf.io/)によりホストされている。


## Kubernetesで何が出来るのか

- 複数ホストへのコンテナの展開
- コンテナのヘルスチェック
- コンテナのスケーリング
- サービスディスカバリ
- 展開されてるコンテナのローリングアップデート
- MonitoringとLogging
- Authn/Authz
- ストレージのマウント

などなど。

掘り下げていくと、様々なコンポーネントが協調して動作してこれらやより良い機能を提供してくれることが
分かってくるが、それはまた後日。

## なぜKubernetesを学ぶのか

- コンテナマネジメントツールとしてほぼデファクト
- DevとOpsの分離
- Infrastructure as Code
- その他エコシステムとの統合

あとは上記の機能の恩恵を受けるため、と個人的には考えている。

まぁ、コンテナオーケストレーションにおいてデファクトだから、だけで十分学ぶ価値はあると思う。

## Kubernetesのアーキテクチャ

Kubernetesを扱う上で絶対抑えること、というわけでもないが、知っておくと拡張する際や先の学習で理解が
進むと思うので簡単に紹介。

Kubernetesは主に2つの役割に分かれている。

{{< img name="k8s-arch" >}}

**Master**

- `kube-apiserver`: APIの提供やAuthn/Authz
- `kube-controller-manager`: リソースの制御
- `kube-scheduler`: コンテナのスケジューリング
- `etcd`: クラスタのデータの永続化

**Worker**

- `kubelet`: コンテナの起動・監視
- `kube-proxy`: 接続の転送
- `Container Runtime`: コンテナランタイム。Dockerやcri-oなど


--------------------------------------------------


というわけで今回はここまで。次回はKubernetesのローカル環境を作ってみましょう。

それでは。
