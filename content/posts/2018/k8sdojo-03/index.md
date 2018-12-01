---
title: Kubernetes道場 3日目 - Podについてとkubectlの簡単な使い方

date: 2018-11-05T01:50:05+09:00
draft: true

tags:
- kubernetes
- advent-calendar-2018
- kubernetes-dojo

resources:
- name: thumbnail
  src: header.jpg
- name: pod-arch
  src: pod-arch.jpg

---

Kubernetes道場 3日目の記事です。

今回はPodについて概要と簡単な説明をする。

# Podとは

PodはKubernetesにデプロイ出来る最小単位で以下の特徴がある。

- 1つ以上のコンテナのグループ
- 共有のネットワークとストレージ
- Podのコンテンツは同一のNodeにDeployされる

以下のようなイメージ。

{{< img name="pod-arch" size="medium" >}}

通常、Podはそれ単体をそのまま扱うことは少ない、というかほぼ無い。

しかし今回は要点を抑えるためにも、勉強がてら作成してみよう。

# PodのManifestを作成する

Podを作成するにはKubernetesのManifestファイルを作成する必要がある。

以下はnginxイメージを使用するPodのManifestである。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
  - name: nginx
    image: nginx
```

さて、これはどこを参考にしてこんな記述になっているのか。

それはKubernetes APIだ。APIのデータをyamlで記述している。

[Kubernetes API Reference Docs v1.12](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.12/)

上記のリファレンスはVersion 1.12のものだ。このドキュメントを元に上記のManifestの項目を追ってみよう。

Podの項目は [こちら](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.12/#pod-v1-core) にある。

各フィールドについて見ていこう。

## apiVersion

`apiVersion` はオブジェクトのSchemaのVersionを指定する。指定については対象のObjectのGroupとVersionを参照する。
Groupがcoreのものは `apiVersion` にVersionに記述されたものを指定する。Groupがcore以外のものは `apiVersion` に `Group/Version`
のように指定する。

例として、Groupが `core` でVersionが `v1` のものは `apiVersion` を `v1` とし、 
Groupが `extensions` でVersionが `v1beta` のものは `apiVersion` を `extensions/v1beta` とする。

今回、例の1つ目と同じであるため、 `apiVersion` を `v1` に指定する。

## kind

`kind` は作成するObject名を指定する。指定については対象のObjectのKindを参照する。

今回はPodを作成するために `Pod` を指定。

## metadata

`metadata` はObjectのMetadataを指定する。

MetadataのnameでResourceの名前を指定する。

その他にもいくつか意味を持つMetadataがあるがそれは補完されたり必須ではないので後日抑えていこう。

`matadata.name` には今回nginxのイメージを使ったPodということで `nginx` と指定した。

## spec

`spec` はオブジェクトの期待する状態を定義する。要はこのフィールドが具体的な設定を指定する場所だ。

Podでは `spec` の下のリンクにある `PodSpec` というObjectを記述する。

[PodSpec v1 core - Kubernetes API Reference Docs v1.12](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.12/#pod-v1-core)

`PodSpec` には様々な項目が指定できる。重要な項目がいくつかあるが、これまた後日追っていこう。

今回は必須の項目である `containers` の `Container` Objectの `name` と `image` を見ていこう。

`name` はPod内でのコンテナ名を指定する。この `name` はPod内でユニークである必要がある。今回は `nginx` と指定した。

`image` はイメージ名を指定する。今回はnginxイメージを使ってコンテナを作成するため `nginx` を指定した。

# Manifestを使ってPodを作成する

さて、先程上げたManifestを使ってPodを作成してみよう。先のManifestを `pod-nginx.yaml` という名前でファイルに保存する。

作成するには `kubectl create` コマンドを使う。また `-f` オプションでManifestファイルを指定する。

```sh
$ kubectl create -f pod-nginx.yaml
pod/nginx created
```

これでPodが作成できた。確認してみよう。Resourceの取得は `kubectl get` コマンドを使う。

```sh
$ kubectl get pod
NAME      READY     STATUS    RESTARTS   AGE
nginx     1/1       Running   0          5m
```

作成したPodが取得できた。実行できているようだ。では、せっかくだが削除してみよう。

Resourceの削除は `kubectl delete` コマンドを使う。
Resource名を指定することも出来るが、 `-f` オプションでManifestファイルを指定して削除することも出来る。

```sh
$ kubectl delete pod/nginx
pod "nginx" deleted
```

削除できた。


--------------------------------------------------


というわけで今回はここまで。今回はPodの簡単な説明とManifestの書き方、Podの作成・取得・削除を行った。

次回はPodの `spec` 中で指定した `containers` フィールドのContainer Objectを掘り下げて見ていこう。

それでは。

