---
title: Kubernetes道場 17日目 - Label / NodeSelector / Annotationについて

date: 2018-12-17T00:00:00+09:00

tags:
- kubernetes
- advent-calendar-2018
- kubernetes-dojo

resources:
- name: thumbnail
  src: header.jpg

---

この記事は [Kubernetes道場 Advent Calendar 2018](https://qiita.com/advent-calendar/2018/k8s-dojo) 17日目の記事です。

今回はLabel / NodeSelector / Annotationについて。

# Label

今までLabelをシレッと使ってきたが改めてここで解説しよう。

Labelはkey/valueの組み合わせKubernetesオブジェクトに指定することができる。

システムに直結する意味合いを持つ設定ではなく、 LabelSelectorなどで使ってきたが、オブジェクトの選択やサブセットの指定などで使用される。

## Labelの構文と使用できる文字列

LabelのKeyは`/` を使って2つのセグメントに分割して表現することができる。`/` より前をPrefix、後をNameと呼ぶ。

Prefixは[DNS_LABEL](https://tools.ietf.org/html/rfc1035#page-8)に従った253文字以下の文字列である。Prefixを省略すると、ユーザー固有のものとして扱われる。

Nameは63文字以下で下の正規表現に従っている必要がある。

```plain
([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9]
```

要は最初と最後はアルファベットか数字、間の文字ではそれらに加えて `-` / `_` / `.` が使用できる。

また、LabelのValueはKeyのNameと同じで、63文字以下で上記の正規表現に従っている必要がある。

以下がラベルの使用例だ。

- `k8s.io/name: nginx`
- `environment: production`

## LabelSelectorについて

LabelSelectorについては過去取り扱ったことがあるので簡単に。

LabelSelectorには2種類の方法がある。

- 等価ベースの比較(matchLabels)
- 集合ベースの比較(matchExpressions)

詳しくは[8日目のこちらの記事](/posts/2018/k8sdojo-08/#label-selector)を参考にしてほしい。

## ラベルの指定方法

ラベルを指定するするにはManifestを使用する方法とCLIから操作する方法がある。

### Manifestを使用する方法

Manifestを使ったラベルの指定は `metadata.labels` に記述する。以下のような感じ。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  labels:
    name: nginx
    environment: dev
spec:
  containers:
  - name: nginx
    image: nginx:alpine
  terminationGracePeriodSeconds: 0
```

`labels` にKey/Valueの形で指定する。

### CLIから操作する方法

Labelはkubectlから操作することも可能だ。 `kubectl label` コマンドで行う。

- ラベルの作成: `kubectl label pod/nginx foo=bar`
- ラベルの更新: `kubectl label --overwrite pod/nginx foo=bar`
- ラベルの削除: `kubectl label pod/nginx foo-`

削除の時だけ少し特殊で、Keyの最後に `-` をつけることで対象のLabelを削除することができる。

## Labelについての実行例

それでは先程出てきた以下のManifestを適用してみよう。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  labels:
    name: nginx
    environment: dev
spec:
  containers:
  - name: nginx
    image: nginx:alpine
  terminationGracePeriodSeconds: 0
```

```plain
$ kubectl apply -f nginx.yaml
pod/nginx created
```

Podの取得は `kubectl get po` でできるが、 `--show-labels` オプションを付けることでLabelも表示することができる。

```plain
$ kubectl get po --show-labels
NAME    READY   STATUS    RESTARTS   AGE   LABELS
nginx   1/1     Running   0          67s   name=nginx
```

Labelがついていることが確認できる。

それではCLIからラベルを付けてみよう。`foo=bar` というラベルを付けるため `kubectl label pod/nginx foo=bar` を実行してみる。

```bash
$ kubectl label pod/nginx foo=bar
pod/nginx labeled
$ kubectl get po --show-labels
NAME    READY   STATUS    RESTARTS   AGE     LABELS
nginx   1/1     Running   0          3m36s   foo=bar,name=nginx
```

ラベルが作成されたのがわかる。

削除も試してみよう。 `kubectl label pod/nginx fooi-` を実行する。

```bash
$ kubectl label pod/nginx foo-
pod/nginx labeled
$ kubectl get po --show-labels
NAME    READY   STATUS    RESTARTS   AGE     LABELS
nginx   1/1     Running   0          6m44s   name=nginx
```

正しく削除できたようだ。

# NodeSelector

NodeSelectorはPodを特定のNodeへスケジューリングする仕組みだ。Selectorと書いてあるから予測できるかと思うが、ここにもLabelSelectorを使う。

NodeのLabelとNodeSelectorの条件がマッチしたNodeに対してスケジューリングされるようになる。

NodeSelectorはPodの `spec.nodeSelector` に指定をする。但し、このNodeSelectorは `matchExpressions` は使えず、完全一致での比較のみになる。

## NodeSelectorを使ってみる

以下のようなManifestを作成した。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: node-selector
spec:
  containers:
  - name: nginx
    image: nginx:alpine
  nodeSelector:
    environment: dev
  terminationGracePeriodSeconds: 0
```

`nodeSelector` に `environment=dev` を指定した。 これを適用してみよう。

```plain
$ kubectl apply -f node-selector.yaml
pod/node-selector created
$ kubectl get po
NAME            READY   STATUS    RESTARTS   AGE
node-selector   0/1     Pending   0          14s
```

`Pending` のままだ。describeを確認してみよう。

```plain
$ kubectl describe po/node-selector
Name:               node-selector
Namespace:          default
Priority:           0
PriorityClassName:  <none>
Node:               <none>
Labels:             <none>
Annotations:        kubectl.kubernetes.io/last-applied-configuration:
                      {"apiVersion":"v1","kind":"Pod","metadata":{"annotations":{},"name":"node-selector","namespace":"default"},"spec":{"containers":[{"image":...
Status:             Pending
IP:
Containers:
  nginx:
    Image:        nginx:alpine
    Port:         <none>
    Host Port:    <none>
    Environment:  <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from default-token-qb4fq (ro)
Conditions:
  Type           Status
  PodScheduled   False
Volumes:
  default-token-qb4fq:
    Type:        Secret (a volume populated by a Secret)
    SecretName:  default-token-qb4fq
    Optional:    false
QoS Class:       BestEffort
Node-Selectors:  environment=dev
Tolerations:     node.kubernetes.io/not-ready:NoExecute for 300s
                 node.kubernetes.io/unreachable:NoExecute for 300s
Events:
  Type     Reason            Age                  From               Message
  ----     ------            ----                 ----               -------
  Warning  FailedScheduling  9s (x20 over 2m53s)  default-scheduler  0/1 nodes are available: 1 node(s) didn't match node selector.
```

スケジューリングに失敗しているのがわかる。 `nodeSelector` で指定した対象がなかったようだ。

それもそのはずでNodeにLabelを今までに貼っていない。

```plain
$ kubectl get node --show-labels
NAME       STATUS   ROLES    AGE     VERSION   LABELS
minikube   Ready    <none>   4h24m   v1.13.0   beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/hostname=minikube
```

というわけでNodeにLabelを追加しよう。以下のコマンドを実行する。

```plain
$ kubectl label node/minikube environment=dev
node/minikube labeled
```

それでは再度Podを確認してみる。

```plain
$ kubectl get po
NAME            READY   STATUS    RESTARTS   AGE
node-selector   1/1     Running   0          16m
```

スケジュールされて実行されたようだ。

ローカル環境だと有り難みが薄いが、実際に複数のNodeがあるクラスタなどでは活用できる機能だ。例えば

- SSDが搭載されているNode
- GPUが搭載されているNode
- 所定のNode群へのDeploy

などなど。実際にマネージドサービスなどで複数Nodeのクラスタを立ち上げて動作を確認すると理解が進むと思う。

# Annotation

Annotationはオブジェクトに対してKey/Valueの形式でMetadataを登録できる仕組みだ。

Labelとほぼ同じ機能だが、Selectorなどで使用されない。

構文と使用できる文字列はLabelと同様だ。Valueについては特に使用文字や長さについて成約がない。

使用方法はManifestで `metadata.annotations` に指定するか、 `kubectl annotate` コマンドで操作をする。

具体的な操作方法はLabelと全く同じためManifestの例だけ記載して適用などについては省略させていただく。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-annotate
  annotations:
    name: nginx
    message: |
      hello world!!
spec:
  containers:
  - name: nginx
    image: nginx:alpine
  terminationGracePeriodSeconds: 0
```


--------------------------------------------------


というわけで今回はここまで。

次回はAffinity / Anti-Affinity / Taint / Tolerationについて見ていこう。

それでは。

