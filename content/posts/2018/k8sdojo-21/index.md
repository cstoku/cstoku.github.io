---
title: Kubernetes道場 21日目 - Cordon / Drain / PodDisruptionBudgetについて

date: 2018-12-21T00:00:00+09:00

tags:
- kubernetes
- advent-calendar-2018
- kubernetes-dojo

resources:
- name: thumbnail
  src: header.jpg
- name: drain-1
  src: drain-1.jpg
- name: drain-2
  src: drain-2.jpg

---

この記事は [Kubernetes道場 Advent Calendar 2018](https://qiita.com/advent-calendar/2018/k8s-dojo) 21日目の記事です。

今回はCordon / Drain / PodDisruptionBudgetについて。

# cordonとuncordon

Cordonは指定したNodeにスケジュールさせないようにするための処理だ。 `kubectl cordon` コマンドで実行することができる。

また、Cordonの状態を解除するための処理が `kubectl uncordon` コマンドだ。

早速使ってみよう。

## cordonを使ってみる

まずNodeを確認しよう。

```plain
$ kubectl get node
kubectl get node
NAME       STATUS   ROLES    AGE   VERSION
minikube   Ready    <none>   24h   v1.13.1
```

さて、この表示された `minikube` をCordonしてみよう。

```plain
$ kubectl cordon minikube
node/minikube cordoned
```

Cordonされたようだ。 `kubectl describe` でNodeを確認してみよう。

```plain
$ kubectl describe node/minikube
Name:               minikube
Roles:              <none>
Labels:             beta.kubernetes.io/arch=amd64
                    beta.kubernetes.io/os=linux
                    kubernetes.io/hostname=minikube
Annotations:        node.alpha.kubernetes.io/ttl: 0
                    volumes.kubernetes.io/controller-managed-attach-detach: true
CreationTimestamp:  Mon, 24 Dec 2018 03:22:13 +0900
Taints:             node.kubernetes.io/unschedulable:NoSchedule
Unschedulable:      true
~~~
```

(下の部分は省略している)

`NoSchedule` のTaintが追加されていることがわかる。
`NoSchedule` のTaintということは、既にスケジュールされているPodは実行したままだが、新たにスケジュールされるPodはこのNodeは対象にならない。

ついでに `kubectl uncordon` も実行してみよう。

```plain
$ kubectl uncordon minikube
node/minikube uncordoned
```

Describeで確認してみる。

```plain
$ kubectl describe node/minikube
Name:               minikube
Roles:              <none>
Labels:             beta.kubernetes.io/arch=amd64
                    beta.kubernetes.io/os=linux
                    kubernetes.io/hostname=minikube
Annotations:        node.alpha.kubernetes.io/ttl: 0
                    volumes.kubernetes.io/controller-managed-attach-detach: true
CreationTimestamp:  Mon, 24 Dec 2018 03:22:13 +0900
Taints:             <none>
Unschedulable:      false
```

先程追加されていたTaintが削除されている。要はスケジュールできるようになった。

# drain

drainはNodeを停止させる前準備として動作しているPodを別Nodeへ退去させるコマンドだ。

早速使ってみよう。

## drainを使ってみる

まず適当なDeploymentを作成しておこう。以下のManifestを作成し、適用する。

```plain
$ kubectl create deploy nginx --image nginx:alpine
deployment.apps/nginx created
```

さて、drainさせてみよう。 `kubectl drain` で行う。

```plain
$ kubectl drain minikube
node/minikube cordoned
pod/nginx-54458cd494-dhf5h evicted
node/minikube evicted
```

ログを見るとまずcordonが実行されたことがわかる。次にDeploymentによって作成されていたPodが追い出されたことがわかる。

それでは追い出されたPodがどうなってるか確認しよう。

```plain
$ kubectl get po
NAME                     READY   STATUS    RESTARTS   AGE
nginx-54458cd494-9d76w   0/1     Pending   0          99s
```

Pendingのままだ。Descirbeで確認しよう。

```plain
$ kubectl describe po
Name:               nginx-54458cd494-9d76w
Namespace:          default
Priority:           0
PriorityClassName:  <none>
Node:               <none>
Labels:             app=nginx
                    pod-template-hash=54458cd494
Annotations:        <none>
Status:             Pending
IP:
Controlled By:      ReplicaSet/nginx-54458cd494
Containers:
  nginx:
    Image:        nginx:alpine
    Port:         <none>
    Host Port:    <none>
    Environment:  <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from default-token-fqjxc (ro)
Conditions:
  Type           Status
  PodScheduled   False
Volumes:
  default-token-fqjxc:
    Type:        Secret (a volume populated by a Secret)
    SecretName:  default-token-fqjxc
    Optional:    false
QoS Class:       BestEffort
Node-Selectors:  <none>
Tolerations:     node.kubernetes.io/not-ready:NoExecute for 300s
                 node.kubernetes.io/unreachable:NoExecute for 300s
Events:
  Type     Reason            Age                    From               Message
  ----     ------            ----                   ----               -------
  Warning  FailedScheduling  2m53s (x3 over 2m55s)  default-scheduler  0/1 nodes are available: 1 node(s) were unschedulable.
```

スケジュールに失敗していることがわかる。これはローカル環境のMinikubeではNodeが1つしかないためだ。

Nodeの方もどうなったか確認してみよう。

```plain
$ kubectl describe node
Name:               minikube
Roles:              <none>
Labels:             beta.kubernetes.io/arch=amd64
                    beta.kubernetes.io/os=linux
                    kubernetes.io/hostname=minikube
Annotations:        node.alpha.kubernetes.io/ttl: 0
                    volumes.kubernetes.io/controller-managed-attach-detach: true
CreationTimestamp:  Mon, 24 Dec 2018 03:22:13 +0900
Taints:             node.kubernetes.io/unschedulable:NoSchedule
Unschedulable:      true
~~~
```

cordonの実行で確認したとおり、 `NoSchedule` がTaintに追加されていることがわかる。

このようにdrainはNodeを停止させる前に動作しているPodを追い出して、Nodeを安全に停止させる準備をしてくれる。

## drainの注意点

drainはNodeを停止させる前準備として便利なコマンドだが、注意することがある。

以下のようなクラスタを考えよう。

{{< img name="drain-1" >}}

Nodeが2つあり、片方のNodeにPodがスケジュールされ、実行されている。

ここで、PodがスケジュールされているNode-oldをdrainしよう。

すると以下のような状態になる。

{{< img name="drain-2" >}}

drainしたためPodが削除され、別のNode-newでPod-1がスケジュールされた。

しかし、このタイミングでPodが1つReadyの状態のものがない。このように、drainを実行する際にReadyのPod数が少なくなったり、0になってしまうケースがある。

これを回避するために `PodDisruptionBudget` というオブジェクトがある。

## PodDisruptionBudget

`PodDisruptionBudget` はPodの最小の有効状態や最大の無効状態の数を指定する。

`PodDisruptionBudget` のPodの管理対象はLabelSelectorで指定する。

`PodDisruptionBudget` のフィールドを解説しよう。

- `spec.maxUnavailable` : Eviction実行時にPodを無効状態にしていい最大数を指定する。絶対値か百分率で指定する。
- `spec.minAvailable` : Eviction実行時にPodを有効状態にしておく最小数を指定する。絶対値か百分率で指定する。
- `spec.selector` : このBudgetを適用する対象のPodを選択するLabelSelectorを指定

以下が `PodDisruptionBudget` の指定例だ。

```yaml
apiVersion: policy/v1beta1
kind: PodDisruptionBudget
metadata:
  name: nginx-pdb
spec:
  minAvailable: "100%"
  selector:
    matchLabels:
      app: nginx
```

このリソースを作成することで、drainを実行した際のEvictionの処理でのPodの停止数を制御することができる。


--------------------------------------------------


というわけで今回はここまで。

次回はIngressについて見ていこう。

それでは。


