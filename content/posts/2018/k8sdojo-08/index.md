---
title: Kubernetes道場 8日目 - ReplicaSet / Deploymentについて

date: 2018-12-08T00:00:00+09:00

tags:
- kubernetes
- advent-calendar-2018
- kubernetes-dojo

resources:
- name: thumbnail
  src: header.jpg
- name: rs
  src: rs.jpg
- name: selector1
  src: selector1.jpg
- name: selector2
  src: selector2.jpg
- name: deployment
  src: deployment.jpg
- name: rolling-update
  src: ru.gif

---

この記事は [Kubernetes道場 Advent Calendar 2018](https://qiita.com/advent-calendar/2018/k8s-dojo) 8日目の記事です。

今回はいよいよReplicaSetとDeploymentについて。

# ReplicaSetについて

{{< img name="rs" >}}

このリソースは直接使用することは少ないが、次に出てくるDeploymentを抑える上で理解が進むのでやっていこう。

ReplicaSetは指定された数のPodを複製し、実行してくれる。

Podの雛形(Pod Template)を定義し、Label Selectorという方法で管理対象を選択してReplicaSetに制御してもらう。

要点としては以下の3つだ。

- `replicas` : Podの複製数
- `selector` : Label Selector。後に詳細
- `template` : Pod Templateを指定

さて、Label SelectorとPod Templateを少し掘り下げてみていこう。

## Label Selector

Label Selectorは読んだとおりだが、Labelを選択するための設定を指定する。

`selector` というフィールドに指定をする。指定の仕方は2つある。

### matchLabels

`matchLabels` は等価ベースの比較をする。 指定したLabelと全て一致したものが対象になる。指定方法は以下の通り。

```yaml
matchLabels:
  app: nginx
  tier: frontend
```

{{< img name="selector1" >}}

### matchExpressions

`matchExpressions` は `operator` を使って柔軟な選択ができる。 `operator` には以下のものが指定できる。

- `In`
- `NotIn`
- `Exists`
- `DoesNotExists`

{{< img name="selector2" >}}

#### `In` と `NotIn`

`In` と `NotIn` は `key` と一致するラベルの値が `values` に指定したリスト内に存在する、または存在しないするかを指定できる。

例は以下の通り。

```yaml
matchExpressions:
- key: app
  operator: In
  values: [nginx, httpd]
```

#### `Exists` と `DoesNotExists`

`Exists` と `DoesNotExists` は `key` に指定したラベル存在する、または存在しないするかを指定できる。

例は以下の通り。

```yaml
matchExpressions:
- key: app
  operator: Exists
- key: tier
  operator: DoesNotExist
```

## Pod Template

Pod TemplateはReplicaSetで複製するためのPodの雛形を指定する。指定は `template` フィールドに指定する。

例は以下の通り。

```yaml
template:
  metadata:
    labels:
      app: nginx
  spec:
    containers:
    - image: nginx
      name: nginx
```

`spec` についてはPodと同様のものなので特に問題ないだろう。 `metadata.labels` でPodのラベルを指定する。

ここで注意が必要なのが、Label Selectorで指定したものが `metadata.labels` で指定したものと一致している必要がある。
一致してない場合はKubernetesから拒否され、作成できない。

# ReplicaSetを作成する

さて、ReplicaSetを作成してみよう。

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - image: nginx
        name: nginx
```

`replicas` 3にセットしておいた。上記のManifestを使って作成する。

```plain
$ kubectl apply -f rs.yaml
replicaset.apps "nginx" created
```

ReplicaSetの取得は `replicaset` 、または省略形の `rs` で可能だ。

```plain
$ kubectl get rs
NAME      DESIRED   CURRENT   READY     AGE
nginx     3         3         3         1m
```

また、複製されているはずのPodも確認してみよう。

```plain
$ kubectl get po
NAME          READY     STATUS    RESTARTS   AGE
nginx-qcf82   1/1       Running   0          58s
nginx-qf4wb   1/1       Running   0          58s
nginx-zbfhz   1/1       Running   0          58s
```

ちゃんと指定した3つのPodを作成しているのが確認できる。


## ReplicaSetのreplica数を増減させる

さて、複製数が指定できるので、これを変更してPodの数を増やしてみよう。方法は2つある。

- Manifestファイルの `replicas` を変更して適用
- `kubectl scale` コマンドを用いて変更

片方ずつ試してみよう。

### replica数を増やす

replica数を増やす際はManifestを変更して行ってみよう。

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: nginx
spec:
  replicas: 10
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - image: nginx
        name: nginx
```

先程のManifestの `replicas` を10に変更して適用してみよう。

```plain
$ kubectl apply -f rs.yaml
replicaset.apps "nginx" configured
$ kubectl get rs
NAME      DESIRED   CURRENT   READY     AGE
nginx     10        10        10        14m
$ kubectl get po
NAME          READY     STATUS    RESTARTS   AGE
nginx-4kl8r   1/1       Running   0          53s
nginx-crvrp   1/1       Running   0          54s
nginx-fk9b5   1/1       Running   0          53s
nginx-gjbwf   1/1       Running   0          54s
nginx-jft2c   1/1       Running   0          53s
nginx-qcf82   1/1       Running   0          14m
nginx-qf4wb   1/1       Running   0          14m
nginx-sx8vm   1/1       Running   0          54s
nginx-xm862   1/1       Running   0          54s
nginx-zbfhz   1/1       Running   0          14m
```

Podが10個に増えたことが確認できる。

### replica数を減らす

replica数を減らす際は `kubectl scale` コマンドを用いて行ってみよう。

`--replicas` オプションで複製数を指定する。

```plain
$ kubectl scale --replicas=1 -f rs.yaml
replicaset.apps "nginx" scaled
$ kubectl get rs
NAME      DESIRED   CURRENT   READY     AGE
nginx     1         1         1         22m
$ kubectl get po
NAME          READY     STATUS    RESTARTS   AGE
nginx-zbfhz   1/1       Running   0          22m
```

Podが1個に減ったことが確認できる。

# Deploymentについて

さて、本命のDeploymentについてだ。

Deploymentは以下の機能を提供する。

- PodのRolling Update
- Rolloutの履歴を保持
- Rollback

Deploymentは実際のところPodを直接管理しているのではなく、ReplicaSetを管理する。
Deploymentを変更した際は、新しいReplicaSetを作成してPodを置き換えていく。

以下のような関係図になる。

{{< img name="deployment" >}}

Deploymentで抑えるべきフィールドは以下の物がある。

- `minReadySeconds`
- `paused`
- `progressDeadlineSeconds`
- `revisionHistoryLimit`
- `strategy`

その他に

- `replicas`
- `selector`
- `template`

があるが、これらのフィールドはReplicaSetと同様のものになる。

## Deploymentのフィールドについて

### minReadySeconds

`minReadySeconds` はPodが作成されてから使用可能な状態になるまでの待ち時間を指定する。デフォルトでは0秒だ。なので指定をしないと即座に使用可能な状態として扱われる。

### paused

`paused` はDeploymentの変更をポーズさせるかを指定する。通常は指定する必要はない。

`kubectl rollout pause` コマンドや `kubectl rollout resume` コマンドでポーズや解除を行うことができる。

### progressDeadlineSeconds

`progressDeadlineSeconds` はDeploymentの処理の最大処理時間を指定する。Deploymentの処理時間がこの時間を超えた場合、 処理を失敗させ `ProgressDeadlineExceeded` をstatusにセットする。

デフォルトは600秒だ。

### revisionHistoryLimit

`revisionHistoryLimit` はリビジョンの履歴の保持する数を指定する。デフォルトは10だ。

### strategy

`strategy` はPodを置き換える際の戦略を指定する。strategyには `Recreate` と `RollingUpdate` がある。
デフォルトは `RollingUpdate` だ。

#### RollingUpdate

`strategy` をRolling Updateにした際は追加で設定をすることができる。`maxSurge` と `maxUnavailable` だ。
`maxSurge` はRolling Update中に複製数をどの程度超えていいかを指定する。 `maxUnavailable` はRolling Update中に無効なPodをどの程度許容するかを指定する。

この2つのフィールドの値は絶対値かPodの数の割合をパーセンテージで指定する。デフォルトはどちらのフィールドも25%だ。

また、どちらかのフィールドを0にした場合、もう片方のフィールドは0にすることができない。

以下が指定方法の例だ。

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 50%
    maxUnavailable: 10%
```

Deploymentはこの `maxSurge` と `maxUnavailable` を元にRolling Updateを行ってくれる。

以下の設定で `replicas` を2に設定した際のRolling Updateは以下の画像のような手順で行われる。

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 50%
    maxUnavailable: 0
```

{{< img name="rolling-update" >}}


#### Recreate

`strategy` をRecreateにした際は、全てのPodを削除してから新しいPod Templateを元にPodを作成する。

ついでに、Rolling UpdateでRecreateと同じ挙動にする場合、 `maxSurge` を0、 `maxUnavailable` を100%のように設定することでできる。

以下が指定方法の例だ。

```yaml
strategy:
  type: Recreate
```

# Deploymentを作成する

以下のようなManifestを作成した。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  strategy:
    rollingUpdate:
      maxSurge: 50%
      maxUnavailable: 0%
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - image: nginx
        name: nginx
```

さて、Manifestを適用してDeploymentを作成してみる。

```plain
$ kubectl apply -f deploy.yaml
deployment.apps "nginx" created
```

Deploymentの取得は `deployment` か短縮形の `deploy` で取得できる。

```plain
$ kubectl get deploy
NAME      DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
nginx     2         2         2            2           1m
$ kubectl get rs
NAME             DESIRED   CURRENT   READY     AGE
nginx-5c7588df   2         2         2         1m
$ kubectl get po
NAME                   READY     STATUS    RESTARTS   AGE
nginx-5c7588df-8ckq5   1/1       Running   0          1m
nginx-5c7588df-l6r22   1/1       Running   0          1m
```

対応してReplicaSetの作成やPodの作成がされていることがわかる。

また、DeploymentのRolloutは `kubectl rollout history` というコマンドで履歴を確認できる。

```plain
$ kubectl rollout history deploy nginx
deployments "nginx"
REVISION  CHANGE-CAUSE
1         <none>
```

先程適用したManifestで作成されたのがRivision 1のものだ。

作成したDeploymentをPauseしてみよう。 `kubectl rollout pause` で可能だ。

```plain
$ kubectl rollout pause deploy nginx
deployment.apps "nginx" paused
```

さて、先程作成したDeploymentのイメージを `nginx:alpine` に変更して適用してみよう。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  strategy:
    rollingUpdate:
      maxSurge: 50%
      maxUnavailable: 0%
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - image: nginx:alpine
        name: nginx
```

```plain
$ kubectl apply -f deploy.yaml
deployment.apps "nginx" configured
```

さて、どのようになったか確認してみる。

```plain
$ kubectl get deploy
NAME      DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
nginx     2         2         0            2           9m
$ kubectl get rs
NAME             DESIRED   CURRENT   READY     AGE
nginx-5c7588df   2         2         2         9m
$ kubectl get po
NAME                   READY     STATUS    RESTARTS   AGE
nginx-5c7588df-8ckq5   1/1       Running   0          9m
nginx-5c7588df-l6r22   1/1       Running   0          9m
```

特に何も変更されてないことがわかる。
これは先程 `kubectl rollout pause` でDeploymentの処理をポーズさせているからだ。

`kubectl rollout resume` で再開できるので実行する。
また、この時からRolling Updateが開始される。可能な方は `watch` コマンドや `kubectl get po -w` などで確認してみよう。

```plain
$ kubectl rollout resume deploy nginx
deployment.apps "nginx" resumed
```

さて、再度各リソースを確認してみよう。

```plain
$ kubectl get deploy
NAME      DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
nginx     2         2         2            2           13m
$ kubectl get rs
NAME               DESIRED   CURRENT   READY     AGE
nginx-5c7588df     0         0         0         13m
nginx-6f4bb658bd   2         2         2         1m
$ kubectl get po
NAME                     READY     STATUS    RESTARTS   AGE
nginx-6f4bb658bd-bgsnz   1/1       Running   0          58s
nginx-6f4bb658bd-m6c9v   1/1       Running   0          1m
```

Podが別のものに置き換わっているのがわかる。また、別のReplicaSetが作成されていることがわかる。

Rolloutの履歴を確認してみよう。

```plain
$ kubectl rollout history deploy nginx
deployments "nginx"
REVISION  CHANGE-CAUSE
1         <none>
2         <none>
```

Revision 2が追加されていることがわかる。

最後にRollbackをやってみよう。Revision 1にRollbackしてみる。 

`kubectl rollout undo` で行う。また、 `--to-revision` オプションでリビジョン番号を指定する。

```plain
$ kubectl rollout undo deploy nginx --to-revision 1
deployment.apps "nginx"
```

さて、各リソースを確認してみよう。

```plain
$ kubectl get deploy
NAME      DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
nginx     2         2         2            2           21m
kubectl get rs
NAME               DESIRED   CURRENT   READY     AGE
nginx-5c7588df     2         2         2         21m
nginx-6f4bb658bd   0         0         0         8m
kubectl get po
NAME                   READY     STATUS    RESTARTS   AGE
nginx-5c7588df-hjqv9   1/1       Running   0          1m
nginx-5c7588df-m42x7   1/1       Running   0          1m
```

Rollbackできている。

Rollbackを実行すると新しいReplicaSetが作成されるのではなく、過去のReplicaSetを再利用してPodを作成していることがわかる。

ついでに、 `kubectl rollout history` を実行した際のCHANGE-CAUSEはリソース作成・適用時に `--record` オプションをつけることで操作する際のコマンドを記録してくれる。

```plain
$ kubectl apply --record -f deploy.yaml
deployment.apps "nginx" created
$ kubectl rollout history deploy nginx
deployments "nginx"
REVISION  CHANGE-CAUSE
1         kubectl apply --record=true --filename=deploy.yaml
```


--------------------------------------------------


というわけで今回はかなり長くなってしまったがここまで。

次回はServiceについて見ていこう。

それでは。

