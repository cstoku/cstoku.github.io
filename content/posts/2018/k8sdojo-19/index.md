---
title: Kubernetes道場 19日目 - Authn / Authz / ServiceAccountについて

date: 2018-12-19T00:00:00+09:00

tags:
- kubernetes
- advent-calendar-2018
- kubernetes-dojo

resources:
- name: thumbnail
  src: header.jpg

---

この記事は [Kubernetes道場 Advent Calendar 2018](https://qiita.com/advent-calendar/2018/k8s-dojo) 19日目の記事です。

今回はAuthn / Authz / ServiceAccountについて。

# KubernetesのAuthentication

KubernetesのAuthn(認証)は以下のものがある。

- X509クライアント証明書
- 静的なTokenファイル
- Bootstrap Token
- 静的なパスワードファイル
- Service Account Token
- OpenId Connect Tokens
- Webhook Token認証

それぞれ簡単に見ていこう。

## X509クライアント証明書

X509のクライアント証明書を使った認証だ。

証明書(公開鍵)のCN(Nommon Name)がユーザ名、O(Organization)がグループとして使われる。

`kubectl` で設定するには以下のような実行をする。

```plain
kubectl config set-credentials NAME --client-certificate=path/to/certfile --client-key=path/to/keyfile
```

## 静的なTokenファイル

Kubernetesで指定されているTokenファイルに指定されているTokenで認証を行う。

Tokenファイルは以下のようなフォーマットだ。

```plain
token,user,uid,"group1,group2,group3"
```

`kubectl` で設定するには以下のような実行をする。

```plain
kubectl config set-credentials NAME --token=TOKEN
```

## Bootstrap Token

クラスタをブートストラップ時に使用されるTokenだ。

ブートストラップからクラスタに参加し、専用の認証情報を取得できるまでの間に使用され、それまでに必要な最低限の権限だけを設定してある。

このTokenは通常 `kubectl` から利用することはない。もちろん使用することはでき、静的なTokenファイルと同様の方法で設定可能だ。

## 静的なパスワードファイル

認証でよくあるユーザ名とパスワードを使用する方法だ。Kubernetesで指定されている認証ファイルを元にBasic認証を行う。

認証ファイルは以下のようなフォーマットだ。

```plain
password,user,uid,"group1,group2,group3"
```

`kubectl` で設定するには以下のような実行をする。

```plain
kubectl config set-credentials NAME --username=basic_user --password=basic_password
```

## Service Account Token

KubernetesにはService Accountという仕組みがある。

作成や削除、権限の付与などをkubectlを通して行うことができる。

Service Accountについては後に見ていこう。

## OpenId Connect Tokens

OpenID Connectを使った認証だ。Kubernetesクラスタ側で適切な設定を行うことで利用することができる。その設定については[こちら](https://kubernetes.io/docs/reference/access-authn-authz/authentication/#configuring-the-api-server)を参照。

`kubectl` で設定するには2つの方法がある。1つ目はOIDC Authenticatorを使った方法だ。

```plain
$ kubectl config set-credentials USER_NAME \
   --auth-provider=oidc \
   --auth-provider-arg=idp-issuer-url=( issuer url ) \
   --auth-provider-arg=client-id=( your client id ) \
   --auth-provider-arg=client-secret=( your client secret ) \
   --auth-provider-arg=refresh-token=( your refresh token ) \
   --auth-provider-arg=idp-certificate-authority=( path to your ca certificate ) \
   --auth-provider-arg=id-token=( your id_token )
```

2つ目はTokenだけを指定する方法だ。

```plain
kubectl config set-credentials NAME --token=TOKEN
```

## Webhook Token認証

Kubernetesの認証を別のサーバーに委譲することができる。Kubernetesから外部の認証サーバーへは[TokenReview](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.13/#tokenreview-v1-authentication-k8s-io)を発行する。認証サーバーはそれを元に認証を行う。

この認証方法については後日解説できればと思う。

kubectl側ではTokenを設定するだけだ。

```
kubectl config set-credentials NAME --token=TOKEN
```

# KubernetesのAuthentication

KubernetesのAuthz(認可)は以下のものがある。

- Node
- ABAC
- RBAC
- Webhook

それぞれ簡単に見ていこう。

## RBAC

ロールベースのアクセス制御(Role-based Access Control)だ。

権限をまとめたRoleというリソースと、Roleとユーザやグループを紐付けるRoleBingingというリソースを定義して設定をする。

現在Kubernetesでは認可には主にこのRBACを利用する。

このRBACは明日の記事で詳しく見ていこう。

## ABAC

属性ベースのアクセス制御(Attribute-based Access Control)だ。

ABACはKubernetesにポリシーファイルを指定することでABACの認可が使用できる。

ポリシーファイルは以下のような内容だ。

```json
{"apiVersion": "abac.authorization.kubernetes.io/v1beta1", "kind": "Policy", "spec": {"group":"system:authenticated",  "nonResourcePath": "*", "readonly": true}}
{"apiVersion": "abac.authorization.kubernetes.io/v1beta1", "kind": "Policy", "spec": {"group":"system:unauthenticated", "nonResourcePath": "*", "readonly": true}}
{"apiVersion": "abac.authorization.kubernetes.io/v1beta1", "kind": "Policy", "spec": {"user":"admin",     "namespace": "*",              "resource": "*",         "apiGroup": "*"                   }}
{"apiVersion": "abac.authorization.kubernetes.io/v1beta1", "kind": "Policy", "spec": {"user":"scheduler", "namespace": "*",              "resource": "pods",                       "readonly": true }}
{"apiVersion": "abac.authorization.kubernetes.io/v1beta1", "kind": "Policy", "spec": {"user":"scheduler", "namespace": "*",              "resource": "bindings"                                     }}
{"apiVersion": "abac.authorization.kubernetes.io/v1beta1", "kind": "Policy", "spec": {"user":"kubelet",   "namespace": "*",              "resource": "pods",                       "readonly": true }}
{"apiVersion": "abac.authorization.kubernetes.io/v1beta1", "kind": "Policy", "spec": {"user":"kubelet",   "namespace": "*",              "resource": "services",                   "readonly": true }}
{"apiVersion": "abac.authorization.kubernetes.io/v1beta1", "kind": "Policy", "spec": {"user":"kubelet",   "namespace": "*",              "resource": "endpoints",                  "readonly": true }}
{"apiVersion": "abac.authorization.kubernetes.io/v1beta1", "kind": "Policy", "spec": {"user":"kubelet",   "namespace": "*",              "resource": "events"                                       }}
{"apiVersion": "abac.authorization.kubernetes.io/v1beta1", "kind": "Policy", "spec": {"user":"alice",     "namespace": "projectCaribou", "resource": "*",         "apiGroup": "*"                   }}
{"apiVersion": "abac.authorization.kubernetes.io/v1beta1", "kind": "Policy", "spec": {"user":"bob",       "namespace": "projectCaribou", "resource": "*",         "apiGroup": "*", "readonly": true }}
```

## Webhook

Kubernetesの認可を別のサーバーに委譲することができる。Kubernetesから外部の認可サーバーへは[SubjectAccessReview](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.13/#subjectaccessreview-v1-authorization-k8s-io)を発行する。認可サーバーはそれを元に認可を行う。

この認可方法については後日解説できればと思う。

## Node

このNodeはKubernetesのNode用の認可処理だ。

なので通常kubectlからの認証情報を元にこの認可処理を利用することはない。

詳しくは[こちらのページ](https://kubernetes.io/docs/reference/access-authn-authz/node/)を参考にしてほしい。

# ServiceAccount

ServiceAccountは先程、Authnの際にもでてきたが認証情報として利用される。

このServiceAccountはPodに指定することでPod内にあるアプリケーションで指定したServiceAccountを利用することができる。

さて、それではServiceAccountを扱ってみよう。

## ServiceAccountの作成

ServiceAccountの作成は `kubectl create serviceaccount` で行う。 `serviceaccount` は省略系の `sa` でも問題ない。

```plain
$ kubectl create sa test-sa
serviceaccount/test-sa created
```

作成されたようだ。 `kubectl get sa` で取得してみよう。

```plain
$ kubectl get sa
NAME      SECRETS   AGE
default   1         20h
test-sa   1         69s
```

先程作成したもの以外にdefaultというServiceAccountがある。これはPodでServiceAccountを指定しなかった場合にこのdefaultが使用される。

このServiceAccountに対してロールを指定し、適切な権限を割り当てる。これについては次回見ていこう。


--------------------------------------------------


というわけで今回はここまで。

次回はRole / RoleBinding / ClusterRole / ClusterRoleBindingについて見ていこう。

それでは。


