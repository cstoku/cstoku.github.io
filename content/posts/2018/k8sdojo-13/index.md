---
title: Kubernetes道場 13日目 - StatefulSet / DaemonSetについて

date: 2018-12-13T00:00:00+09:00

tags:
- kubernetes
- advent-calendar-2018
- kubernetes-dojo

resources:
- name: thumbnail
  src: header.jpg

---

この記事は [Kubernetes道場 Advent Calendar 2018](https://qiita.com/advent-calendar/2018/k8s-dojo) 13日目の記事です。

今回はStatefulSetとDaemonSetについて。

# StatefulSet

## StatefulSetの概要

StatefulSetは状態を保持する(ステートフルな)アプリケーションを管理するためのKubernetesオブジェクトだ。

イメージ的にはPodTemplateを持つDeploymentにPVCも追加した感じ。

StatefulSetには以下のような特徴がある。

- 安定したネットワーク識別子
- 安定した永続ストレージ
- 順序付けされたグレースフルなデプロイとスケール
- 順序付けされた自動ローリングアップデート

1つずつ見ていこう。

### 安定したネットワーク識別子

StatefulSetで管理されるPodは順序付けされたユニークな識別子が付与される。
StatefulSetで複製数をNにした際には、0からN-1の序数が使用される。

この識別子がネットワークの識別子にも利用される。Podのホスト名は `$(StatefulSet Name)-$(Ordinal)` になる。

また、Headless Serviceを使ってPodのドメインを設定することが出来る。
その場合は `$(StatefulSet Name)-$(Ordinal).$(Service Name).$(Namespace).svc.$(Cluster Domain)` というドメインになる。
(通常、コンテナの `resolve.conf` の `search` に `$(Namespace).svc.$(Cluster Domain)` が設定されているため `$(StatefulSet Name)-$(Ordinal).$(Service Name)` で引けるはずだ)

### 安定した永続ストレージ

StatefulSetはVolumeClaimTemplateで指定されたClaimそれぞれに1つずつのPVが作成され、Podにマウントされる。

StatefulSetによって作成されたPVCは、StatefulSetが削除された際にはPVCは削除されない。PVCを削除する場合は手動で削除する必要がある。

### 順序付けされたグレースフルなデプロイとスケール

StatefulSetが作成・削除された際の動きを確認しよう。

##### StatefulSet作成時

複製数NのStatefulSetを作成され、Podが作成される際は、0から順に1つずつN-1まで作成される。

##### StatefulSetのPodが削除される際

Podが削除される際は、StatefulSetの序数の逆順で停止・削除が実行される。

##### StatefulSetスケール時

StatefulSetのスケール時には既にあるStatefulSetのPodが全てReady状態である必要がある。

##### StatefulSetのPod停止時

StatefulSetのPodを停止する際には、対象のPodより序数が大きいPod全てが完全にシャットダウンしている必要がある。

#### StatefulSetの管理ポリシー

StatefulSetのPodを管理するポリシーを変更することが出来る。ポリシーは現状2種類ある。

##### OrderedReady

StatefulSetのデフォルトで上記で解説した動きでPodの管理を行う。

##### Parallel

`Parallel` ではStatefulSetで管理する全てのPodの起動や停止を並行して行う。

また、起動や停止の際にReady状態や完全に停止するのを待たずに行う。


### 順序付けされた自動ローリングアップデート

StatefulSetは `spec.updateStrategy` フィールドでPodの自動ローリングアップデートを有効や無効に設定できる。

#### StatefulSetの更新戦略(Update Strategies)

##### RollingUpdate

StatefulSetのPodを自動的に更新する。デフォルトはこの `RollingUpdate` が使用される。

StatefulSetのローリングアップデートは停止処理と同様で序数が大きいPodから順位1つずつ更新が行われる。

###### パーティションについて

`RollingUpdate` で自動的に更新する際に `updateStrategy.partition` を指定すると、指定した数値以上のPodのみを対象として更新が行われる。

以下のように指定する。

```yaml
updateStrategy:
  type: RollingUpdate
  partition: 3
```

##### OnDelete

`OnDelete` は古い動作の設定だ。この値を指定すると、StatefulSetのPodは自動的に更新されない。

更新するには手動でPodを削除する。するとStatefulSetが自動的に新しいアプリケーションのPodを作成する。

## StatefulSetのフィールドについて

StatefulSetのフィールドについて見ていこう。しかし、殆どのフィールドがDeplyomentと同じ内容なので簡単に解説する。

### StatefulSet特有のフィールド

##### podManagementPolicy

Podの管理ポリシーを指定する。 詳細は[こちら](#statefulsetの管理ポリシー)。 `OrderedReady` か `Parallel` を指定する。デフォルトは `OrderedReady` だ。

##### serviceName

StatefulSetのPodを対象としているServiceの名前を指定する。このフィールドで指定されるServiceはStatefulSetが作成されるよりも先に作成される必要がある。

##### updateStrategy

StatefulSetの更新戦略を指定する。詳細は[こちら](#statefulsetの管理ポリシー)。

`updateStrategy.type` に `RollingUpdate` か `OnDelete` を指定する。デフォルトは `RollingUpdate` だ。

##### volumeClaimTemplates

PVCのTemplateのリストを指定する。ここで指定したPVCの名前は少なくとも1つのコンテナの `volumeMount` で指定されている必要がある。

PVCについては [Kubernetes道場 12日目 - PersistentVolume / PersistentVolumeClaim / StorageClassについて](/posts/2018/k8sdojo-12/#persistentvolumeclaim-1) を参考にしてほしい。

### Deploymentと同じフィールド

Deploymentと同じものを指定するので復習程度に見ていこう。

- `replicas` : Podの複製数
- `revisionHistoryLimit` : リビジョンの履歴の保持数
- `selector` : 管理対象のPodを選択するLabelSelectorを指定
- `template` : Podのテンプレートを指定

## StatefulSetを使用してみる

### StatefulSetの作成

StatefulSetの作成の前に、StatefulSetで作成されるPodを対象とするServiceをHeadless Serviceとして作成しよう。

以下のようなManifestを作成した。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: stateful
spec:
  clusterIP: None
  selector:
    app: stateful
```

上記のManifestを適用しよう。

```plain
$ kubectl apply -f stateful-svc.yaml
service/nginx created
```

さて、それではStatefulSetを作成してみよう。

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: stateful
spec:
  replicas: 3
  selector:
    matchLabels:
      app: stateful
  serviceName: stateful
  template:
    metadata:
      labels:
        app: stateful
    spec:
      containers:
      - image: alpine
        name: stateful
        command: ["sh", "-c"]
        args:
        - |
          trap 'exit' SIGTERM
          touch /data/hostname
          while true; do
            echo "`date`: `hostname`" >> /data/hostname
            sleep 1
          done
        volumeMounts:
        - name: data
          mountPath: /data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 64Mi
```

上記のManifestは、複製数3で `64MiB` のPVCをPodのコンテナの `/data` にマウントするStatefulSetだ。

次に起動時のPodの挙動を見るため、別のターミナルで `kubectl get po  -w` を実行しておく。

それでは先程のManifestを適用してみよう。

```plain
$ kubectl apply -f stateful.yaml
statefulset.apps/stateful created
```

適用後の `kubectl get po  -w` の表示だ。

```plain
$ kubectl get po  -w
NAME         READY   STATUS    RESTARTS   AGE
stateful-0   0/1     Pending   0          0s
stateful-0   0/1   Pending   0     0s
stateful-0   0/1   ContainerCreating   0     0s
stateful-0   1/1   Running   0     5s
stateful-1   0/1   Pending   0     0s
stateful-1   0/1   Pending   0     0s
stateful-1   0/1   ContainerCreating   0     0s
stateful-1   1/1   Running   0     4s
stateful-2   0/1   Pending   0     0s
stateful-2   0/1   Pending   0     0s
stateful-2   0/1   ContainerCreating   0     0s
stateful-2   1/1   Running   0     4s
```

0から順に1つずつPodが作成されていることが分かる。

また、StatefulSetの取得は `statefulset` か省略形の `sts` で行う。

```plain
$ kubectl get sts
NAME       READY   AGE
stateful   3/3     68s
```

### StatefulSetのローリングアップデート

さて、次にローリングアップデートを確認しよう。

先程作成したStatefulSetのManifestを少し変更した。(Shellのsleepを5に変更しただけ)

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: stateful
spec:
  replicas: 3
  selector:
    matchLabels:
      app: stateful
  serviceName: stateful
  template:
    metadata:
      labels:
        app: stateful
    spec:
      containers:
      - image: alpine
        name: stateful
        command: ["sh", "-c"]
        args:
        - |
          trap 'exit' SIGTERM
          touch /data/hostname
          while true; do
            echo "`date`: `hostname`" >> /data/hostname
            sleep 5
          done
        volumeMounts:
        - name: data
          mountPath: /data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 64Mi
```

先程同様、 `kubectl get po -w` を別で実行させつつ上記のManifestを適用してみる。

```plain
$ kubectl apply -f stateful.yaml
statefulset.apps/stateful configured
```

`kubectl get po -w` の表示を確認する。

```plain
NAME         READY   STATUS    RESTARTS   AGE
stateful-0   1/1     Running   0          3m54s
stateful-1   1/1     Running   0          3m49s
stateful-2   1/1     Running   0          3m45s
stateful-2   1/1   Terminating   0     4m33s
stateful-2   0/1   Terminating   0     4m34s
stateful-2   0/1   Terminating   0     4m35s
stateful-2   0/1   Terminating   0     4m35s
stateful-2   0/1   Pending   0     0s
stateful-2   0/1   Pending   0     0s
stateful-2   0/1   ContainerCreating   0     0s
stateful-2   1/1   Running   0     4s
stateful-1   1/1   Terminating   0     4m43s
stateful-1   0/1   Terminating   0     4m44s
stateful-1   0/1   Terminating   0     4m45s
stateful-1   0/1   Terminating   0     4m45s
stateful-1   0/1   Pending   0     0s
stateful-1   0/1   Pending   0     0s
stateful-1   0/1   ContainerCreating   0     0s
stateful-1   1/1   Running   0     4s
stateful-0   1/1   Terminating   0     4m54s
stateful-0   0/1   Terminating   0     4m55s
stateful-0   0/1   Terminating   0     4m55s
stateful-0   0/1   Terminating   0     4m58s
stateful-0   0/1   Terminating   0     4m58s
stateful-0   0/1   Pending   0     0s
stateful-0   0/1   Pending   0     0s
stateful-0   0/1   ContainerCreating   0     0s
stateful-0   1/1   Running   0     4s
```

Podの更新が序数が大きいものから順番に1つずつ更新されているのが分かる。

さて、最後にStatefulSetを削除しよう。

```plain
$ kubectl delete -f stateful.yaml
statefulset.apps "stateful" deleted
```

この時のPVとPVCを確認してみよう。

```plain
$ kubectl get pv,pvc
NAME                                                        CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                     STORAGECLASS   REASON   AGE
persistentvolume/pvc-a9e267f0-00ae-11e9-b4e7-888b9d185d62   64Mi       RWO            Delete           Bound    default/data-stateful-0   standard                18m
persistentvolume/pvc-ae40b908-00ae-11e9-b4e7-888b9d185d62   64Mi       RWO            Delete           Bound    default/data-stateful-1   standard                18m
persistentvolume/pvc-b0ac84cb-00ae-11e9-b4e7-888b9d185d62   64Mi       RWO            Delete           Bound    default/data-stateful-2   standard                18m

NAME                                    STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
persistentvolumeclaim/data-stateful-0   Bound    pvc-a9e267f0-00ae-11e9-b4e7-888b9d185d62   64Mi       RWO            standard       18m
persistentvolumeclaim/data-stateful-1   Bound    pvc-ae40b908-00ae-11e9-b4e7-888b9d185d62   64Mi       RWO            standard       18m
persistentvolumeclaim/data-stateful-2   Bound    pvc-b0ac84cb-00ae-11e9-b4e7-888b9d185d62   64Mi       RWO            standard       18m
```

この様にStatefulSetが削除されてもPVCとPVCによって作成されたPVは削除されない。同名で同様の設定をしたStatefulSetが作成された際に再利用される。削除する際は手動で削除する必要がある。

StatefulSetはこのへんで終わりにしよう。

# DaemonSet

## DaemonSetの概要

DaemonSetは全て・一部のノードで指定されたPodを実行することを保証する。特徴としては以下の通りだ。

- ノードが追加されるとDaemonSetで指定されたPodが追加される
- ノードが削除されるとDaemonSetで管理されていたPodが削除される
- DaemonSet自体が削除されると対象のPodが削除される

DaemonSetの使用例としては以下のようなものがある。

- `glusterd` や `ceph` のようなクラスタデーモンを実行
- `fluentd` のようなログ収集デーモンを実行
- `NodeExpoter` や `datadog-agent` などのメトリクスエージェントの実行

特定のいくつかのノードでだけでPodを実行させることも可能だが、 `nodeSelector` や `nodeAffinity` を利用する必要がある。
こちらについては後日解説するため一旦置いておこう。

DaemonSetは更新の際にはDeployment同様にローリングアップデートが可能だ。

## DaemonSetのフィールドについて

DaemonSetのフィールドは殆どDeploymentのものと同じだ。一応確認しておこう。

- `minReadySeconds` : Podが作成されてから有効とされるまでの時間を指定
- `revisionHistoryLimit` : リビジョンの履歴の保持数
- `selector` : 管理対象のPodを選択するLabelSelectorを指定
- `template` : Podのテンプレートを指定
- `updateStrategy` : 更新戦略の指定
  - `type` : 戦略の種類を指定。 `RollingUpdate` か `OnDelete` 指定可能。デフォルトは `RollingUpdate`
  - `rollingUpdate` : ローリングアップデートの設定を指定。 `type` で `RollingUpdate` を指定した際にだけ使用
    - `maxUnavailable` : 更新中に無効になっていいPodの数を指定。絶対値か全体のPodの数の百分率で指定

## DaemonSetを使用してみる

一応Minikubeの環境でDaemonSetを作成してみよう。

以下のようなManifestを用意した。

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
spec:
  selector:
    matchLabels:
      app: fluentd
  template:
    metadata:
      labels:
        app: fluentd
    spec:
      containers:
      - image: fluent/fluentd
        name: fluentd
```

上記のManifestを適用してみる。

```plain
$ kubectl apply -f ds.yaml
daemonset.apps/fluentd created
```

DaemonSetの取得は `daemonset` か省略形の `ds` を指定する。

```plain
$ kubectl get ds
NAME      DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
fluentd   1         1         1       1            1           <none>          42s
$ kubectl get po -o wide
NAME            READY   STATUS    RESTARTS   AGE   IP           NODE       NOMINATED NODE   READINESS GATES
fluentd-9sjlf   1/1     Running   0          72s   172.17.0.5   minikube   <none>           <none>
```

1つのPodが作成されていることが分かる。

ここで複数Nodeのクラスタの場合、そのNode数分だけのPodが各Nodeに1つずつ作成される。

しかし、今回はMinikubeで作成したローカル環境なのでNode数が1となっている。そのため1つのPodしか作成されない。

もし余裕がある方はマネージドサービスなどのクラスタで複数Nodeに展開されるのを確認してみると良いだろう。


--------------------------------------------------


というわけで今回はここまで。

次回はJob / CronJobについて見ていこう。

それでは。

