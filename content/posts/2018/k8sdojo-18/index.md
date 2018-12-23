---
title: Kubernetes道場 18日目 - Affinity / Anti-Affinity / Taint / Tolerationについて

date: 2018-12-18T00:00:00+09:00

tags:
- kubernetes
- advent-calendar-2018
- kubernetes-dojo

resources:
- name: thumbnail
  src: header.jpg
- name: tk
  src: tk.jpg
- name: tk-type
  src: tk-type.jpg
- name: tk-zone
  src: tk-zone.jpg
- name: tk-hostname
  src: tk-hostname.jpg
- name: pa-sched-fig
  src: pa-sched-fig.jpg
- name: pa-sched-affinity
  src: pa-sched-affinity.jpg
- name: pa-sched-anti-affinity
  src: pa-sched-anti-affinity.jpg

---

この記事は [Kubernetes道場 Advent Calendar 2018](https://qiita.com/advent-calendar/2018/k8s-dojo) 18日目の記事です。

今回はAffinity / Anti-Affinity / Taint / Tolerationについて。

# Affinity / Anti-Affinity

AffinityはPodのスケジュールについての条件を指定をする機能だ。Affinityについては以下の3つの種類がある。

- Node Affinity
- Pod Affinity
- Pod Anti-Affinity

一つずつ見ていこう。

## Node Affinity

Node AffinityはNodeにあるLabelを元にPodのスケジュールを行う。
前回にこの機能に近い `nodeSelector` があったが、これよりも柔軟な指定をすることができる。

条件の指定方法には2種類あり、

- `matchExpressions` : NodeのLabelに対して集合ベースの比較
- `matchFields` : Nodeオブジェクトのフィールドに対して集合ベースの比較

`matchExpressions` については以前と同様の指定で行えるので割愛するが、 `matchFields` については初めて扱うので少し見ていこう。

### matchFields

`matchFields` はオブジェクトのフィールドに対して集合ベースの比較を行う。

フィールドについては `matchExpressions` と同様のものだが、 `key` にはオブジェクトのフィールド名を指定する。

以下が指定例だ。

```yaml
key: metadata.name
operator: In
values:
- hoge
- fuga
```

この `matchFields` をサポートしているフィールドはオブジェクトによって異なる。
`metadata.name` と `metadata.namespace` は全てのオブジェクトでサポートされている。

サポートされていないフィールドを `key` に指定するとエラーとなる。

## Pod Affinity / Anti-Affinity

Pod AffinityとPod Anti-Affinityは既にスケジュールされているPodのラベルを元に、自身のスケジュールを行う。

Pod Affinityは条件にマッチした場合はスケジュールされ、Pod Anti-Affinityは条件にマッチした場合はスケジュール対象から除外される。

条件の指定方法は以下の3つのフィールドを使って行う。

- `labelSelector` : PodのLabelに対してのLabelSelectorを指定する。 `matchLabels` と `matchExpressions` が指定可能だ。
- `namespaces` : LabelSelectorの対象にするNamespaceをリストで指定する。指定しなかったり空リストにした場合、現在スケジュールしようとしているPodのNamespaceが対象になる。
- `topologyKey` : NodeのLabelのKeyを指定する。このフィールドは必須である。

さて、 `labelSelector` と `namespaces` についてはつかめると思うが、 `topologyKey` が難しいところだ。詳しく見ていこう。

### Topology Key

Topology Keyはトポロジードメインを示すのに使用する。簡単に言うとNodeのLabelを使った範囲の指定だ。

ここに16台のNodeがあったとしよう。

{{< img name="tk" >}}

これらのNodeには以下の3つのKeyのLabelがついている。

- hostname
- zone
- type

ここでTopology Keyを指定するのだが、Topology Keyに指定するのはNodeのLabelのKeyを指定する。

Topology Keyに `type` を指定すると以下の4つの範囲がトポロジーとして扱われる。

{{< img name="tk-type" >}}

別の例を見よう。Topology Keyに `zone` を指定すると以下の2つの範囲がトポロジーとして扱われる。

{{< img name="tk-zone" >}}

ここまででだいたい感覚がつかめてきたと思うが、Topology Keyで指定されたKeyに対応するValueで一致したものが同一のトポロジーとして扱われる。

最後の例としてNode毎にトポロジーを切りたい場合には `hostname` を指定すればよい。

{{< img name="tk-hostname" >}}

### Pod Affinity / Anti-Affinityのスケジュールの詳細

さて、それではトポロジーの概念も抑えたことなのでPod Affinity / Anti-Affinityのスケジュールについてもう少し詳しく見ていく。

Pod AffinityはLabelSelectorで指定したPodとトポロジー内で同じ場所にスケジュールされるようにする設定だ。

現在クラスタには以下のような感じでPodが動いているとしよう。

{{< img name="pa-sched-fig" >}}

そして以下の設定を下Podをスケジュールすることを考える。

```yaml
labelSelector:
  matchLabels:
    app: memcached
topologyKey: type
```

`app=memcached` とマッチするようなPodと同一トポロジーにスケジュールさせる設定だ。

これを図で確認すると以下のようになる。

{{< img name="pa-sched-affinity" >}}

また、この条件をPod Anti-Affinityに設定すると逆の意味になり、同一のトポロジーにスケジュールしないようになる。

実際には以下のような図でスケジュールしようとする。

{{< img name="pa-sched-anti-affinity" >}}

このようにPod Affinity / Anti-Affinityはトポロジーの範囲・場所と、現在スケジュールされているPodが重要になってくる。

## 条件の必須要件と推奨要件

AffinityとAnti-Affinityにはルールを必須にするのと、推奨にする2つの要件を指定することができる。以下の2つがそのフィールドだ。

- `requiredDuringSchedulingIgnoredDuringExecution` : 必須要件の指定
- `preferredDuringSchedulingIgnoredDuringExecution` : 推奨要件の指定

フィールド名が無駄に長いが、要は実行しているPodを除いてスケジュールしているときの要件ということだ。

`requiredDuringSchedulingIgnoredDuringExecution` については簡単で、条件が満たされなかった際はスケジュールされない。

`preferredDuringSchedulingIgnoredDuringExecution` は少し複雑だ。

個々に指定したルールに対してWeightをする。このWeightは1から100の間で指定する。
そして各ルールをNode毎に評価し、ルールにマッチした際はWeightの値を加算していく。
最後に加算した結果が一番大きいNodeがスケジュール対象となる。

要はWeightを大きくしたルールが優先されて評価され、スケジュールされるわけだ。

## Affinity / Anti-Affinityの例

MinikubeでAffinity / Anti-Affinityのテストはできるが、Nodeが1個しかないので少し退屈なものになってしまう。

もしMulti-Nodeなクラスタを使用できる方はそれを使って検証してみるといいだろう。

今回はMinikubeでAffinity / Anti-Affinityを指定して、スケジュールがされるか、されないかを見ていこう。

### Node Affinityの例

Node Affinityを使ってみよう。まず、NodeについているLabelを確認するため、以下のコマンドを実行する。

```plain
$ kubectl get node --show-labels
NAME       STATUS   ROLES    AGE   VERSION   LABELS
minikube   Ready    <none>   27h   v1.13.0   beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/hostname=minikube
```

ここで任意のLabelをNodeにつけてもいいが、手間なので今回は `kubernetes.io/hostname=minikube` というこのLabelを利用して設定を書いてみよう。

まず、先程のLabelと一致するようなNode Affinityを指定するようなManifestを作成した。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-node-affinity
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: kubernetes.io/hostname
            operator: In
            values:
            - minikube
  containers:
  - name: nginx
    image: nginx:alpine
```

これを適用して取得してみる。

```plain
$ kubectl apply -f nginx-node-affinity.yaml
pod/nginx-node-affinity created
$ kubectl get -f nginx-node-affinity.yaml
NAME                  READY   STATUS    RESTARTS   AGE
nginx-node-affinity   1/1     Running   0          70s
```

スケジュールされて実行できているようだ。

それでは条件が満たされないように、 `operator` を `NotIn` に変更したManifestを作成してみる。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-node-affinity-nosched
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: kubernetes.io/hostname
            operator: NotIn
            values:
            - minikube
  containers:
  - name: nginx
    image: nginx:alpine
```

これを適用して取得してみる。

```plain
$ kubectl apply -f nginx-node-affinity-nosched.yaml
pod/nginx-node-affinity-nosched created
$ kubectl get -f nginx-node-affinity-nosched.yaml
NAME                          READY   STATUS    RESTARTS   AGE
nginx-node-affinity-nosched   0/1     Pending   0          5s
```

`Pending` のままだ。 `kubectl describe` で確認してみよう。

```plain
$ kubectl describe -f nginx-node-affinity-nosched.yaml
Name:               nginx-node-affinity-nosched
Namespace:          default
Priority:           0
PriorityClassName:  <none>
Node:               <none>
Labels:             <none>
Annotations:        kubectl.kubernetes.io/last-applied-configuration:
                      {"apiVersion":"v1","kind":"Pod","metadata":{"annotations":{},"name":"nginx-node-affinity-nosched","namespace":"default"},"spec":{"affinity...
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
Node-Selectors:  <none>
Tolerations:     node.kubernetes.io/not-ready:NoExecute for 300s
                 node.kubernetes.io/unreachable:NoExecute for 300s
Events:
  Type     Reason            Age               From               Message
  ----     ------            ----              ----               -------
  Warning  FailedScheduling  3s (x9 over 70s)  default-scheduler  0/1 nodes are available: 1 node(s) didn't match node selector.
```

スケジュールに失敗しているのがわかる。

では、`requiredDuringSchedulingIgnoredDuringExecution` を `preferredDuringSchedulingIgnoredDuringExecution` に変えたManifestを作成してみる。

`preferredDuringSchedulingIgnoredDuringExecution` を指定するのでWeightを指定すること。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-node-affinity-preferred
spec:
  affinity:
    nodeAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 1
        preference:
          matchExpressions:
          - key: kubernetes.io/hostname
            operator: NotIn
            values:
            - minikube
  containers:
  - name: nginx
    image: nginx:alpine
```

これを適用して取得してみる。

```plain
$ kubectl apply -f nginx-node-affinity-preferred.yaml
pod/nginx-node-affinity-preferred created
$ kubectl get -f nginx-node-affinity-preferred.yaml
NAME                            READY   STATUS    RESTARTS   AGE
nginx-node-affinity-preferred   1/1     Running   0          44s
```

スケジュールされて実行されているのがわかる。これは推奨要件の指定なので、条件が満たされなかった場合は通常通りスケジュールされるだけだ。

### Pod Affinity / Anti-Affinityの例

Pod Affinity / Anti-Affinityを使ってみよう。先に以下のManifestを適用してmemcachedのPodを作成しておこう。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: memcached
  labels:
    app: memcached
spec:
  containers:
  - name: memcached
    image: memcached:alpine
```

```plain
$ kubectl apply -f memcached.yaml
pod/memcached created
```

それではPod Affinityを設定したPodのManifestを作成してみる。今回はTopology Keyを `kubernetes.io/hostname` として、 `app=memcached` のPodと同じトポロジーに配置されるようにした。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod-affinity
spec:
  affinity:
    podAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
          - key: app
            operator: In
            values:
            - memcached
        topologyKey: kubernetes.io/hostname
  containers:
  - name: nginx
    image: nginx:alpine
```

これを適用してみよう。

```plain
kubectl apply -f nginx-pod-affinity.yaml
pod/nginx-pod-affinity created
bash-3.2$ kubectl get -f nginx-pod-affinity.yaml
NAME                 READY   STATUS    RESTARTS   AGE
nginx-pod-affinity   1/1     Running   0          6s
```

スケジュールされた。 `app=memcached` にマッチするPod(memcached Pod)がトポロジー(minikube)に存在するためスケジュールされたわけだ。

否定形や `preferredDuringSchedulingIgnoredDuringExecution` はだいたい同じなので、Pod Anti-Affinityを試してみよう。

フィールド名の `podAffinity` を `podAntiAffinity` に変更するだけだ。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod-anti-affinity
spec:
  affinity:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
          - key: app
            operator: In
            values:
            - memcached
        topologyKey: kubernetes.io/hostname
  containers:
  - name: nginx
    image: nginx:alpine
```

適用してみよう。

```plain
$ kubectl apply -f nginx-pod-anti-affinity.yaml
pod/nginx-pod-anti-affinity created
bash-3.2$ kubectl get -f nginx-pod-anti-affinity.yaml
NAME                      READY   STATUS    RESTARTS   AGE
nginx-pod-anti-affinity   0/1     Pending   0          8s
```

`Pending` のままなので `kubectl describe` で確認してみよう。

```plain
$ kubectl describe -f nginx-pod-anti-affinity.yaml
Name:               nginx-pod-anti-affinity
Namespace:          default
Priority:           0
PriorityClassName:  <none>
Node:               <none>
Labels:             <none>
Annotations:        kubectl.kubernetes.io/last-applied-configuration:
                      {"apiVersion":"v1","kind":"Pod","metadata":{"annotations":{},"name":"nginx-pod-anti-affinity","namespace":"default"},"spec":{"affinity":{"...
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
Node-Selectors:  <none>
Tolerations:     node.kubernetes.io/not-ready:NoExecute for 300s
                 node.kubernetes.io/unreachable:NoExecute for 300s
Events:
  Type     Reason            Age               From               Message
  ----     ------            ----              ----               -------
  Warning  FailedScheduling  1s (x7 over 47s)  default-scheduler  0/1 nodes are available: 1 node(s) didn't match pod affinity/anti-affinity, 1 node(s) didn't match pod anti-affinity rules.
```

スケジュールできていないことがわかる。`app=memcached` にマッチするPod(memcached Pod)がスケジュールされていないトポロジーがなかったためにスケジュールできなかったわけだ。

このようにAffinity / Anti-Affinityを使って柔軟なPodのスケジュールを行うことができる。

#  Taint / Toleration











--------------------------------------------------


というわけで今回はここまで。

次回はAuthn / Authz / ServiceAccountについて見ていこう。

それでは。

