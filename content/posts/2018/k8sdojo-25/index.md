---
title: Kubernetes道場 25日目 - Kubernetesの情報元やコミュニティについて

date: 2018-12-25T00:00:00+09:00

tags:
- kubernetes
- advent-calendar-2018
- kubernetes-dojo

resources:
- name: thumbnail
  src: header.jpg
- name: k8sdojo
  src: k8sdojo.jpg

---

この記事は [Kubernetes道場 Advent Calendar 2018](https://qiita.com/advent-calendar/2018/k8s-dojo) 25日目の記事です。

今回は最終回ということでKubernetesの情報元やコミュニティについて

# Kubernetesの情報元

Kubernetesの情報を集める際に便利なサイトなどなどを紹介しよう。

まずはKubernetesの公式サイト。

[Production-Grade Container Orchestration - Kubernetes](https://kubernetes.io/)

Kubernetesの公式ドキュメント。

[Kubernetes Documentation - Kubernetes](https://kubernetes.io/docs/)

Kubernetesの公式リファレンス。

[Reference - Kubernetes](https://kubernetes.io/docs/reference)

そしてKubernetesの公式のBlog。

[Kubernetes Blog - Kubernetes](https://kubernetes.io/blog/)

結局ソースコード読もう。となってたどり着くGitHubのKubernetes Org

[Kubernetes - GitHub](https://github.com/kubernetes)

Kubernetesのリポジトリの本体

[kubernetes/kubernetes: Production-Grade Container Scheduling and Management](https://github.com/kubernetes/kubernetes)

Kubernetesの情報を毎週発信してくれるサイト

[KubeWeekly](https://us10.campaign-archive.com/home/?u=3885586f8f1175194017967d6&id=11c1b8bcb2)

Googleが配信しているKubernetesのPodCast

[Kubernetes Podcast from Google](https://kubernetespodcast.com/)


こんなところかな。

# Kubernetesのコミュニティ

 次にKubernetesのコミュニティについて紹介。

## Kubernetes Slack

Joinするかたはこちらから。

[Join Kubernetes on Slack!](http://slack.k8s.io/)

参加済みの方はこちらから。

[Kubernetes Slack](https://kubernetes.slack.com/)

おすすめチャンネル

- [jp-users | Kubernetes Slack](https://kubernetes.slack.com/messages/C0QKVN230/): 日本人ディスカッション用
- [jp-events | Kubernetes Slack](https://kubernetes.slack.com/messages/C0QKU3RQA/): 日本のイベントディスカッション用
- [kubernetes-docs-ja | Kubernetes Slack](https://kubernetes.slack.com/messages/CAG2M83S8/): 日本語ドキュメント翻訳ディスカッション用

## Kubernetes Commnity Repo

Kubernetes Community用のリポジトリ

[kubernetes/community: Kubernetes community content](https://github.com/kubernetes/community)

KubernetesのCommunity Membership

[community/community-membership.md at master - kubernetes/community](https://github.com/kubernetes/community/blob/master/community-membership.md)

## 日本のKubernetesに関するコミュニティ

Kubernetes Meetup Tokyo。日本で一番大きい

[Kubernetes Meetup Tokyo - connpass](https://k8sjp.connpass.com/)

Cloud Native Meetup Tokyo。Kubernetesに限らないがオススメ

[Cloud Native Meetup Tokyo - connpass](https://cloudnative.connpass.com/)

Cloud Native Developers JP。こちらもKubernetesに限らないがオススメ

[Cloud Native Developers JP - connpass](https://cnd.connpass.com/)

## Kubernetesに関するカンファレンス

KubeCon + CloudNativeCon。Kubernetesについて世界で一番でかいカンファレンス。

[KubeCon + CloudNativeCon Events - Cloud Native Computing Foundation](https://www.cncf.io/community/kubecon-cloudnativecon-events/)

CloudNativeDays。旧JapanContainerDays。日本でKubernetesやCloudNativeについては一番でかいカンファレンス。

[CloudNativeDays](https://cloudnativedays.jp/)

[JapanContainerDays](https://containerdays.jp/)

## Contribution

ほぼ宣伝。

Kubernetes Documentaionの日本語化。一応自分はOwner/Approverやってます。

[website/content/ja at master - kubernetes/website](https://github.com/kubernetes/website/tree/master/content/ja)

上にも上げたが、日本語化のためのSlackチャンネル。

[kubernetes-docs-ja | Kubernetes Slack](https://kubernetes.slack.com/messages/CAG2M83S8/)

Kubernetes-docs-jaのConnpassグループ

[Kubernetes sig-docs-ja - connpass](https://k8s-docs-ja.connpass.com/)

# Kubernetesのオススメ本

オレオレ主観でのオススメ本

入門Kubernetes。あのKelsey Hightowerが著者。それの翻訳本。

[入門 Kubernetes | Amazon](https://www.amazon.co.jp/gp/product/4873118409/)

Kuvernetes In Action。英語の本だがめちゃめちゃ詳しく書かれているらしい。

[Kubernetes in Action | Amazon](https://www.amazon.co.jp/gp/product/1617293725/)

Kubernetes完全ガイド。完全ガイドと言ってるだけあってよくまとまってる。そして完全ガイドと言ってるだけあってページ数もすごい。

[Kubernetes完全ガイド | Amazon](https://www.amazon.co.jp/gp/product/4295004804/)

# まとめ

さてさて。Kubernetes道場、お疲れ様でした。

ここまで全て目を通して学んでくれた方は、入門を通り越してKubernetesをバリバリ使える並の知識がついていると思う。
(自分の文章力が壊滅的で読みづらい箇所が多々あったかと思う・・・、申し訳ない:bow:)

これからもKubernetesについての記事はどんどん書いていくつもりなので、適当に見に来ていただければと思う。

それでは、Have a great k8s life!! :tada::tada:

{{< img name="k8sdojo" >}}

