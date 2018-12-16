---
title: Kubernetes道場 15日目 - Namespace / Resource QoS / ResourceQuota / LimitRangeについて

date: 2018-12-15T00:00:00+09:00

tags:
- kubernetes
- advent-calendar-2018
- kubernetes-dojo

resources:
- name: thumbnail
  src: header.jpg

---

この記事は [Kubernetes道場 Advent Calendar 2018](https://qiita.com/advent-calendar/2018/k8s-dojo) 15日目の記事です。

今回はNamespace / Resource QoS / ResourceQuota / LimitRangeについて。

# Namespace

## Namespaceの概要

NamespaceはKubernetesのクラスタに名前空間を用意できる。

Kubernetesの各リソースはNamespaceに属するものと属さないものがある。

Namespaceに属するリソースの例としては以下のものがある。

- Pod
- Deployment
- PersistentVolumeClaim
- ConfigMap
- Service

こちらの方は結構身近なものが多くある。

Namespaceに属さないリソースの例としては以下のものがある。

- PersistentVolume
- StorageClass
- Node
- Namespace

実はPersistentVolumeはNamespaceで分離されていない。

リソースがNamespaceで分離されるかを確認する場合は `kubectl api-resources` コマンドが使用できる。

```plain
$ kubectl api-resources --namespaced=true
NAME                        SHORTNAMES   APIGROUP                    NAMESPACED   KIND
bindings                                                             true         Binding
configmaps                  cm                                       true         ConfigMap
endpoints                   ep                                       true         Endpoints
events                      ev                                       true         Event
limitranges                 limits                                   true         LimitRange
persistentvolumeclaims      pvc                                      true         PersistentVolumeClaim
pods                        po                                       true         Pod
podtemplates                                                         true         PodTemplate
replicationcontrollers      rc                                       true         ReplicationController
resourcequotas              quota                                    true         ResourceQuota
secrets                                                              true         Secret
serviceaccounts             sa                                       true         ServiceAccount
services                    svc                                      true         Service
controllerrevisions                      apps                        true         ControllerRevision
daemonsets                  ds           apps                        true         DaemonSet
deployments                 deploy       apps                        true         Deployment
replicasets                 rs           apps                        true         ReplicaSet
statefulsets                sts          apps                        true         StatefulSet
localsubjectaccessreviews                authorization.k8s.io        true         LocalSubjectAccessReview
horizontalpodautoscalers    hpa          autoscaling                 true         HorizontalPodAutoscaler
cronjobs                    cj           batch                       true         CronJob
jobs                                     batch                       true         Job
leases                                   coordination.k8s.io         true         Lease
events                      ev           events.k8s.io               true         Event
daemonsets                  ds           extensions                  true         DaemonSet
deployments                 deploy       extensions                  true         Deployment
ingresses                   ing          extensions                  true         Ingress
networkpolicies             netpol       extensions                  true         NetworkPolicy
replicasets                 rs           extensions                  true         ReplicaSet
networkpolicies             netpol       networking.k8s.io           true         NetworkPolicy
poddisruptionbudgets        pdb          policy                      true         PodDisruptionBudget
rolebindings                             rbac.authorization.k8s.io   true         RoleBinding
roles                                    rbac.authorization.k8s.io   true         Role
$ kubectl api-resources --namespaced=false
NAME                              SHORTNAMES   APIGROUP                       NAMESPACED   KIND
componentstatuses                 cs                                          false        ComponentStatus
namespaces                        ns                                          false        Namespace
nodes                             no                                          false        Node
persistentvolumes                 pv                                          false        PersistentVolume
mutatingwebhookconfigurations                  admissionregistration.k8s.io   false        MutatingWebhookConfiguration
validatingwebhookconfigurations                admissionregistration.k8s.io   false        ValidatingWebhookConfiguration
customresourcedefinitions         crd,crds     apiextensions.k8s.io           false        CustomResourceDefinition
apiservices                                    apiregistration.k8s.io         false        APIService
tokenreviews                                   authentication.k8s.io          false        TokenReview
selfsubjectaccessreviews                       authorization.k8s.io           false        SelfSubjectAccessReview
selfsubjectrulesreviews                        authorization.k8s.io           false        SelfSubjectRulesReview
subjectaccessreviews                           authorization.k8s.io           false        SubjectAccessReview
certificatesigningrequests        csr          certificates.k8s.io            false        CertificateSigningRequest
podsecuritypolicies               psp          extensions                     false        PodSecurityPolicy
podsecuritypolicies               psp          policy                         false        PodSecurityPolicy
clusterrolebindings                            rbac.authorization.k8s.io      false        ClusterRoleBinding
clusterroles                                   rbac.authorization.k8s.io      false        ClusterRole
priorityclasses                   pc           scheduling.k8s.io              false        PriorityClass
storageclasses                    sc           storage.k8s.io                 false        StorageClass
volumeattachments                              storage.k8s.io                 false        VolumeAttachment
```

`NAMESPACED` で `true` になっているものがNamespaceに属するリソースだ。
ついでに、このコマンドでKubernetesで作成できるオブジェクトが確認できる。

## Namespaceを作成してみる

Namespaceを作成してみよう。CLIを通して作成することが出来る。

```plain
$ kubectl create ns test-ns
namespace/test-ns created
```

Namespaceの取得は `namespace` か既に使用しているが短縮形の `ns` 利用できる。

```plain
$ kubectl get ns
NAME          STATUS   AGE
default       Active   20h
kube-public   Active   20h
kube-system   Active   20h
test-ns       Active   3m26s
```

さて、作成した `test-ns` が確認できるが、それ以外にも3つNamespaceがあるのが確認できる。

実は今までリソースを作成していたNamespaceはdefaultであった。ついでに確認してみよう。

CLIで適当なDeploymentを作ってみる。

```plain
$ kubectl create deploy nginx --image nginx
deployment.apps/nginx created
$ kubectl get all
NAME                       READY   STATUS    RESTARTS   AGE
pod/nginx-5c7588df-tmf6c   1/1     Running   0          21s

NAME                 TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
service/kubernetes   ClusterIP   10.96.0.1    <none>        443/TCP   21h

NAME                    READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/nginx   1/1     1            1           21s

NAME                             DESIRED   CURRENT   READY   AGE
replicaset.apps/nginx-5c7588df   1         1         1       21s
```

作成できたのが分かる。 Namespaceを指定したリソースの操作は `-n` オプションを使用する。

```plain
$ kubectl get all -n default
NAME                       READY   STATUS    RESTARTS   AGE
pod/nginx-5c7588df-tmf6c   1/1     Running   0          110s

NAME                 TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
service/kubernetes   ClusterIP   10.96.0.1    <none>        443/TCP   21h

NAME                    READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/nginx   1/1     1            1           110s

NAME                             DESIRED   CURRENT   READY   AGE
replicaset.apps/nginx-5c7588df   1         1         1       110s
$ kubectl get all -n test-ns
No resources found.
```

`default` Namespaceにリソースが作成されているのが分かる。

さて、先程作成した `test-ns` にDeploymentを作成してみる。

```plain
$ kubectl create deploy httpd --image httpd -n test-ns
deployment.apps/httpd created
$ kubectl get all -n test-ns
NAME                        READY   STATUS    RESTARTS   AGE
pod/httpd-8b465f84f-gjbzc   1/1     Running   0          16s

NAME                    READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/httpd   1/1     1            1           16s

NAME                              DESIRED   CURRENT   READY   AGE
replicaset.apps/httpd-8b465f84f   1         1         1       16s
```

この様に指定したNamespaceにリソースを作成できる。

NamespaceはManifestを使用して作成することも出来る。

```yaml
apiVersion: v1
Kind: Namespace
metadata:
  name: test-ns
```

また、リソースを指定のNamespaceで作成したい場合にManifestに記述することも出来る。

`.metadata.namespace` に指定することで可能だ。以下が指定例だ。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: test-pod
  namespace: test-ns
spec:
  containers:
  - name: nginx
    image: nginx
  terminationGracePeriodSeconds: 0
```

ついでに先程Namespaceにあった `kube-system` や `kube-public` を一応確認しておこう。

```plain
$ kubectl get all -n kube-system
NAME                                      READY   STATUS    RESTARTS   AGE
pod/coredns-86c58d9df4-rlb97              1/1     Running   0          21h
pod/coredns-86c58d9df4-z8fbn              1/1     Running   0          21h
pod/etcd-minikube                         1/1     Running   0          21h
pod/kube-addon-manager-minikube           1/1     Running   0          21h
pod/kube-apiserver-minikube               1/1     Running   0          21h
pod/kube-controller-manager-minikube      1/1     Running   0          21h
pod/kube-proxy-bphqh                      1/1     Running   0          21h
pod/kube-scheduler-minikube               1/1     Running   0          21h
pod/kubernetes-dashboard-fb9d74ff-jkcrl   1/1     Running   0          21h
pod/storage-provisioner                   1/1     Running   0          21h

NAME                           TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)         AGE
service/kube-dns               ClusterIP   10.96.0.10      <none>        53/UDP,53/TCP   21h
service/kubernetes-dashboard   ClusterIP   10.111.143.32   <none>        80/TCP          21h

NAME                        DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
daemonset.apps/kube-proxy   1         1         1       1            1           <none>          21h

NAME                                   READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/coredns                2/2     2            2           21h
deployment.apps/kubernetes-dashboard   1/1     1            1           21h

NAME                                            DESIRED   CURRENT   READY   AGE
replicaset.apps/coredns-86c58d9df4              2         2         2       21h
replicaset.apps/kubernetes-dashboard-fb9d74ff   1         1         1       21h
$ kubectl get all -n kube-public
No resources found.
```

`kube-public` には特にリソースはなさそうだ。 `kube-system` には様々なリソースがあることが分かる。

これらのリソースはKubernetesの重要なコンポーネントとして動作している。
これらのコンポーネントについて解説をしたいところだが、きりがないのでこれらのコンポーネントについては別の機会に取り扱うことにしよう。

# Resource QoS

さて、少し唐突には鳴ってしまうが次はPodのサービス品質について抑えておこう。

## サービス品質の種類

KubernetesはPodを作成する際にサービス品質のクラスの1つを割り当てる。

そのサービス品質のクラスは3つある。

- Guaranteed
- Burstable
- BestEffort

1つずつ見ていこう。

### Guaranteed

Guaranteedは以下の要件に一致したPodに割り当てられる。

- Podの全てのコンテナにMemoryの `limit` と `requests` が指定されており、それらが同じ値である
- Podの全てのコンテナにCPUの `limit` と `requests` が指定されており、それらが同じ値である

要はCPUとMemoryの `limit` と `requests` を同じ値で指定した際にGuaranteedクラスが割り当てられる。

確認してみよう。以下のManifestを適用させてみる。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: qos-guaranteed
spec:
  containers:
  - name: nginx
    image: nginx
    resources:
      limits:
        cpu: "100m"
        memory: "64Mi"
      requests:
        cpu: "100m"
        memory: "64Mi"
  terminationGracePeriodSeconds: 0
```

```plain
$ kubectl apply -f qos-guaranteed.yaml
pod/qos-guaranteed created
$ kubectl get -f qos-guaranteed.yaml -o jsonpath='{.status.qosClass}'
Guaranteed
```

QoSのクラスがGuaranteedになっているのが分かる。

### Burstable

Burstableは以下の要件に一致したPodに割り当てられる。

- QoSクラスのGuaranteedに当てはまらない
- Pod内のコンテナのうち少なくとも1つがCPUかMemoryの `requests` を指定している場合

要はPod内のコンテナで `limit` を指定せず、 `requests` だけ指定しているものが1つでもあった場合がBurstableにあたる。

確認してみよう。以下のManifestを適用させてみる。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: qos-burstable
spec:
  containers:
  - name: nginx
    image: nginx
    resources:
      requests:
        cpu: "100m"
  terminationGracePeriodSeconds: 0
```

```plain
$ kubectl apply -f qos-burstable.yaml
pod/qos-burstable created
$ kubectl get -f qos-burstable.yaml -o jsonpath='{.status.qosClass}'
Burstable
```

QoSのクラスがBurstableになっているのが分かる。

### BestEffort

さて、最後のBestEffortは以下の要件に一致したPodに割り当てられる。

- Pod内の全てのコンテナでCPUやMemoryの `limit` や `requests` が指定さていない場合

要はPod内のコンテナ全てで `limit` や `requests` 指定してなかった際ににBestEffortクラスが割り当てられる。

確認してみよう。以下のManifestを適用させてみる。(これまでいつも作成してきた設定のものだ)

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: qos-besteffort
spec:
  containers:
  - name: nginx
    image: nginx
  terminationGracePeriodSeconds: 0
```

```plain
$ kubectl apply -f qos-besteffort.yaml
pod/qos-besteffort created
$ kubectl get -f qos-besteffort.yaml -o jsonpath='{.status.qosClass}'
BestEffort
```

QoSのクラスがBestEffortになっているのが分かる。

QoSの説明はここまでだが、この後にこのQoSのクラスが設定に関わってくるので先に解説した。

# ResourceQuota

ResourceQuotaはNamespaceに対してリソースのクオータを設定することが出来る。

実はResourceQuotaとあるが、リソースに対してだけではなく、APIリソースの数に対しても設定できる。

設定できるクオータを見ていこう。

## リソースのクオータ

### コンピュートリソースのクオータ

コンピュートリソースで指定できるクオータは以下のものがある。

- `cpu` : 全てのPodのCPUの `requests` の合計
- `requests.cpu` : 全てのPodのCPUの `requests` の合計
- `memory` : 全てのPodのMemoryの `requests` の合計
- `requests.memory` : 全てのPodのMemoryの `requests` の合計
- `limits.cpu` : 全てのPodのCPUの `limits` の合計
- `limits.memory` : 全てのPodのMemoryの `limits` の合計

### ストレージリソースのクオータ

ストレージリソースで指定できるクオータは以下のものがある。

- `requests.storage` : 全てのPVCの容量の `requests` の合計
- `persistentvolumeclaims` : 全てのPVCの数
- `<storage-class-name>.storageclass.storage.k8s.io/requests.storage` : StorageClass毎のPVCの容量の `requests` の合計
- `<storage-class-name>.storageclass.storage.k8s.io/persistentvolumeclaims` : StorageClass毎のPVCの数
- `requests.ephemeral-storage` : 全てのローカルエフェメラルストレージの `requests` の合計
- `limits.ephemeral-storage` : 全てのローカルエフェメラルストレージの `limits` の合計

### APIリソース数のクオータ

APIリソースの数の名前の指定は以下のフォーマットで指定する。

```plain
count/<resource>.<group>
```

以下がいくつかの例だ。

- `count/services` : 全てのServiceの数
- `count/configmaps` : 全てのConfigMapの数
- `count/deployments.apps` : 全てのDeploymentの数
- `count/cronjobs.batch` : 全てのCronJobの数

## クオータのスコープについて

ResourceQuotaはスコープというリソースの対象範囲を指定できる機能がある。

このスコープを指定すると、スコープがマッチした対象のリソースのみに対してクオータがかかる。

スコープの種類は以下のものがある。

- `Terminating` : `activeDeadlineSeconds` が0秒以上に指定されているPod
- `NotTerminating` : `activeDeadlineSeconds` が指定されていないPod 
- `BestEffort` : QoSでBestEffortのクラスが割り当てられているPod
- `NetBestEffort` : QoSでBestEffortのクラス以外が割り当てられているPod

### PriorityClassを使ったResourceQuota

ResourceQuotaではスコープセレクタを使ったPriorityClass毎のクオータの設定が出来る。

指定方法はラベルセレクタの `matchExpression` にかなり似ている。

以下が指定方法の例だ。

```yaml
scopeSelector:
  matchExpressions:
  - operator : In
    scopeName: PriorityClass
    values: ["high"]
```

scopeNameに `PriorityClass` を指定して、ValueにPriorityClassの名前を指定する。

ここで指定したPriorityClassをPodの `priorityClassName` に指定することでResourceQuotaの対象とすることが出来る。

ここの設定についてはフィールドの説明で見ていこう。

## ResourceQuotaのフィールドについて

さて、ResourceQuotaのフィールドについて見ていこう。

##### hard

リソースのクオータを指定する。詳細は[こちら](#リソースのクオータ)。

指定例は以下の通り。

```yaml
hard:
  cpu: "100m"
  memory: "1Gi"
  count/pods: 20
```

##### scopeSelector

scopeの指定をする。 `matchExpressions` で指定する。

- `matchExpressions[].operator` : `In` / `NotIn` / `Exist` / `DoesNotExist` を指定
- `matchExpressions[].scopeName` : 対象にするScopeの名前を指定
- `matchExpressions[].values[]` : 評価する値をリストで指定

現状(v1.13)scopeNameに指定できるのは以下のものだ。

- `Terminating`
- `NotTerminating`
- `BestEffort`
- `NotBestEffort`
- `PriorityClass`

実際のところ、この `scopeSelector` で使用するのはほぼ `PriorityClass` だろう。

指定例は以下の通り。

```yaml
scopeSelector:
  matchExpressions:
  - operator: In
    scopeName: PriorityClass
    values: ["high", "medium"]
```

##### scopes

scopeをリストで指定する。詳細は[こちら](#クオータのスコープについて)。

指定例は以下の通り。

```
scopes:
- BestEffort
```

## ResourceQuotaを使用してみる

さて、簡単なResourceQuotaを作成して挙動を見てみよう。

以下のようなManifestを作成した。

```yaml
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: rq-notbesteffort
spec:
  hard:
    cpu: "500m"
    memory: 128Mi
  scopes:
  - NotBestEffort
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: rq-besteffort
spec:
  hard:
    count/pods: "0"
  scopes:
  - BestEffort
```

適用してみよう。

```plain
$ kubectl apply -f rq.yaml
resourcequota/rq-notbesteffort created
resourcequota/rq-besteffort created
```

さて、Podを作成してみよう。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: besteffort
spec:
  containers:
  - name: nginx
    image: nginx
  terminationGracePeriodSeconds: 0
```

上記のManifestを適用してみる。

```plain
$ kubectl apply -f besteffort.yaml
Error from server (Forbidden): error when creating "besteffort.yaml": pods "besteffort" is forbidden: exceeded quota: rq-besteffort, requested: count/pods=1, used: count/pods=0, limited: count/pods=0
```

エラーがでた。 `rq-besteffort` のクオータにかかってしまっている。先程作成したResourceQuotaでBestEffortで作成できるPodの数を0に指定しているためだ。

さて、それではBestEffortではないPodを作成しよう。以下のようなDeploymentを作成した。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
spec:
  replicas: 5
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
        resources:
          limits:
            cpu: 100m
            memory: 8Mi
```

上記のManifestを適用しよう。

```plain
$ kubectl apply -f notbesteffort.yaml
deployment.apps/nginx created
```

さて、Podを確認してみよう。

```plain
$ kubectl get po
NAME                            READY   STATUS    RESTARTS   AGE
notbesteffort-d6f99c74d-2v62p   1/1     Running   0          3m10s
notbesteffort-d6f99c74d-gb4vc   1/1     Running   0          2m34s
notbesteffort-d6f99c74d-kd9zx   1/1     Running   0          3m12s
notbesteffort-d6f99c74d-p979q   1/1     Running   0          2m31s
notbesteffort-d6f99c74d-xvjjs   1/1     Running   0          3m10s
```

ここでPodを1つ増やしてみよう。

```plain
$ kubectl scale --replicas 6 -f notbesteffort.yaml
deployment.apps/notbesteffort scaled
$ kubectl get po
NAME                            READY   STATUS    RESTARTS   AGE
notbesteffort-d6f99c74d-2v62p   1/1     Running   0          4m30s
notbesteffort-d6f99c74d-gb4vc   1/1     Running   0          3m54s
notbesteffort-d6f99c74d-kd9zx   1/1     Running   0          4m32s
notbesteffort-d6f99c74d-p979q   1/1     Running   0          3m51s
notbesteffort-d6f99c74d-xvjjs   1/1     Running   0          4m30s
```

増えていないことが分かる。Deploymentを確認してみよう。

```plain
kubectl describe -f notbesteffort.yaml
Name:                   notbesteffort
Namespace:              default
CreationTimestamp:      Mon, 17 Dec 2018 06:17:45 +0900
Labels:                 <none>
Annotations:            deployment.kubernetes.io/revision: 1
                        kubectl.kubernetes.io/last-applied-configuration:
                          {"apiVersion":"apps/v1","kind":"Deployment","metadata":{"annotations":{},"name":"notbesteffort","namespace":"default"},"spec":{"replicas":...
Selector:               app=notbesteffort
Replicas:               6 desired | 5 updated | 5 total | 5 available | 1 unavailable
StrategyType:           RollingUpdate
MinReadySeconds:        0
RollingUpdateStrategy:  25% max unavailable, 25% max surge
Pod Template:
  Labels:  app=notbesteffort
  Containers:
   nginx:
    Image:      nginx
    Port:       <none>
    Host Port:  <none>
    Limits:
      cpu:        100m
      memory:     8Mi
    Environment:  <none>
    Mounts:       <none>
  Volumes:        <none>
Conditions:
  Type             Status  Reason
  ----             ------  ------
  Progressing      True    NewReplicaSetAvailable
  Available        True    MinimumReplicasAvailable
  ReplicaFailure   True    FailedCreate
OldReplicaSets:    <none>
NewReplicaSet:     notbesteffort-d6f99c74d (5/6 replicas created)
Events:
  Type    Reason             Age    From                   Message
  ----    ------             ----   ----                   -------
  Normal  ScalingReplicaSet  5m19s  deployment-controller  Scaled up replica set notbesteffort-d6f99c74d to 1
  Normal  ScalingReplicaSet  5m17s  deployment-controller  Scaled up replica set notbesteffort-d6f99c74d to 3
  Normal  ScalingReplicaSet  4m41s  deployment-controller  Scaled up replica set notbesteffort-d6f99c74d to 4
  Normal  ScalingReplicaSet  4m38s  deployment-controller  Scaled up replica set notbesteffort-d6f99c74d to 5
  Normal  ScalingReplicaSet  88s    deployment-controller  Scaled up replica set notbesteffort-d6f99c74d to 6  
```

Deploymentはスケールさせようとしているが、1つPodがunavailableになっているのが分かる。

ついでにReplicaSetも確認してみよう。 NewReplicaSetに表示されているものを `kubectl describe` で確認する。

```plain
kubectl describe rs/notbesteffort-d6f99c74d
Name:           notbesteffort-d6f99c74d
Namespace:      default
Selector:       app=notbesteffort,pod-template-hash=d6f99c74d
Labels:         app=notbesteffort
                pod-template-hash=d6f99c74d
Annotations:    deployment.kubernetes.io/desired-replicas: 6
                deployment.kubernetes.io/max-replicas: 8
                deployment.kubernetes.io/revision: 1
Controlled By:  Deployment/notbesteffort
Replicas:       5 current / 6 desired
Pods Status:    5 Running / 0 Waiting / 0 Succeeded / 0 Failed
Pod Template:
  Labels:  app=notbesteffort
           pod-template-hash=d6f99c74d
  Containers:
   nginx:
    Image:      nginx
    Port:       <none>
    Host Port:  <none>
    Limits:
      cpu:        100m
      memory:     8Mi
    Environment:  <none>
    Mounts:       <none>
  Volumes:        <none>
Conditions:
  Type             Status  Reason
  ----             ------  ------
  ReplicaFailure   True    FailedCreate
Events:
  Type     Reason            Age                    From                   Message
  ----     ------            ----                   ----                   -------
  Normal   SuccessfulCreate  12m                    replicaset-controller  Created pod: notbesteffort-d6f99c74d-kd9zx
  Normal   SuccessfulCreate  12m                    replicaset-controller  Created pod: notbesteffort-d6f99c74d-xvjjs
  Normal   SuccessfulCreate  12m                    replicaset-controller  Created pod: notbesteffort-d6f99c74d-2v62p
  Normal   SuccessfulCreate  11m                    replicaset-controller  Created pod: notbesteffort-d6f99c74d-gb4vc
  Normal   SuccessfulCreate  11m                    replicaset-controller  Created pod: notbesteffort-d6f99c74d-p979q
  Warning  FailedCreate      8m45s                  replicaset-controller  Error creating: pods "notbesteffort-d6f99c74d-94fpf" is forbidden: exceeded quota: rq-notbesteffort, requested: cpu=100m, used: cpu=500m, limited: cpu=500m
  Warning  FailedCreate      8m45s                  replicaset-controller  Error creating: pods "notbesteffort-d6f99c74d-fkws2" is forbidden: exceeded quota: rq-notbesteffort, requested: cpu=100m, used: cpu=500m, limited: cpu=500m
  Warning  FailedCreate      8m45s                  replicaset-controller  Error creating: pods "notbesteffort-d6f99c74d-g8n2p" is forbidden: exceeded quota: rq-notbesteffort, requested: cpu=100m, used: cpu=500m, limited: cpu=500m
  Warning  FailedCreate      8m45s                  replicaset-controller  Error creating: pods "notbesteffort-d6f99c74d-8lcvt" is forbidden: exceeded quota: rq-notbesteffort, requested: cpu=100m, used: cpu=500m, limited: cpu=500m
  Warning  FailedCreate      8m45s                  replicaset-controller  Error creating: pods "notbesteffort-d6f99c74d-qwd5w" is forbidden: exceeded quota: rq-notbesteffort, requested: cpu=100m, used: cpu=500m, limited: cpu=500m
  Warning  FailedCreate      8m45s                  replicaset-controller  Error creating: pods "notbesteffort-d6f99c74d-m6m78" is forbidden: exceeded quota: rq-notbesteffort, requested: cpu=100m, used: cpu=500m, limited: cpu=500m
  Warning  FailedCreate      8m45s                  replicaset-controller  Error creating: pods "notbesteffort-d6f99c74d-sndn2" is forbidden: exceeded quota: rq-notbesteffort, requested: cpu=100m, used: cpu=500m, limited: cpu=500m
  Warning  FailedCreate      8m45s                  replicaset-controller  Error creating: pods "notbesteffort-d6f99c74d-49p75" is forbidden: exceeded quota: rq-notbesteffort, requested: cpu=100m, used: cpu=500m, limited: cpu=500m
  Warning  FailedCreate      8m44s                  replicaset-controller  Error creating: pods "notbesteffort-d6f99c74d-766sv" is forbidden: exceeded quota: rq-notbesteffort, requested: cpu=100m, used: cpu=500m, limited: cpu=500m
  Warning  FailedCreate      3m18s (x8 over 8m43s)  replicaset-controller  (combined from similar events): Error creating: pods "notbesteffort-d6f99c74d-899tw" is forbidden: exceeded quota: rq-notbesteffort, requested: cpu=100m, used: cpu=500m, limited: cpu=500m

```

具体的なエラーが確認できただろう。

rq-notbesteffortのクオータを超えてしまっているようだ。 `100m` のPodが5個有り、6個目を作成使用してクオータの `500m` に引っかかった。

新しくPodを作成するのであれば、クオータを引き上げる様に変更するか、Podのコンテナの `limits` を少なくすることで調整する必要がある。

最後にResourceQuotaを `kubectl describe` で確認してみよう。

```plain
kubectl describe resourcequota/rq-notbesteffort
Name:       rq-notbesteffort
Namespace:  default
Scopes:     NotBestEffort
 * Matches all pods that have at least one resource requirement set. These pods have a burstable or guaranteed quality of service.
Resource  Used  Hard
--------  ----  ----
cpu       500m  500m
memory    40Mi  128Mi
```

CPUのUsedがHardの `500m` に達しているのが確認できる。

# LimitRange

## LimitRangeの概要

LimitRangeはKubernetesのオブジェクトにコンピュートリソースやストレージリソースに対して最小・最大・デフォルト値などを設定できるオブジェクトだ。

LimitRangeで制限の対象を指定できるオブジェクトは以下の3つだ。(制限をかけれるリソースも併記しておく)

- Pod
  - cpu
  - memory
- Container
  - cpu
  - memory
- PersistentVolumeClaim
  - storage

## LimitRangeのフィールドについて

LimitRangeは `limits` にリストで指定する。その内容を見ていこう。

##### default

リソースの `limits` を省略された際のデフォルト値を指定する。

##### defaultRequest

リソースの `requests` を省略された際のデフォルト値を指定する。

##### max

リソースの最大使用量を指定する。

##### maxLimitRequestRatio

このフィールドを指定した場合、対象リソースは `requests` と `limits` の両方を指定する必要が有り、`limits` と `requests` の比がこのフィールドの値を超えないように指定する必要がある。

要は `limits` は `requests` と `maxLimitRequestRatio` をかけた値より大きい値を指定できない。その比率を指定する。

##### min

リソースの最小使用量を指定する。

##### type

制限を適用するリソースの種類を指定する。

## LimitRangeを使用してみる

さて、LimitRangeを作成してみよう。以下のManifestを作成した。

```yaml
apiVersion: "v1"
kind: "LimitRange"
metadata:
  name: limitrange
spec:
  limits:
  - type: "Pod"
    max:
      cpu: "500m"
      memory: "512Mi"
    min:
      cpu: "50m"
      memory: "4Mi"
  - type: "Container"
    max:
      cpu: "200m"
      memory: "128Mi"
    min:
      cpu: "50m"
      memory: "4Mi"
    default:
      cpu: "100m"
      memory: "64Mi"
    defaultRequest:
      cpu: "100m"
      memory: "32Mi"
```

上記のManifestを適用する。

```plain
$ kubectl apply -f limitrange.yaml
limitrange/limitrange created
```

さて、いくつかPodを作成してみよう。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod
spec:
  containers:
  - name: nginx
    image: nginx
  terminationGracePeriodSeconds: 0
```

上記のManifestを適用して確認してみる。

```plain
$ kubectl apply -f pod.yaml
pod/pod created
$ kubectl describe -f pod.yaml
Name:               pod
Namespace:          default
Priority:           0
PriorityClassName:  <none>
Node:               minikube/192.168.122.144
Start Time:         Mon, 17 Dec 2018 07:45:25 +0900
Labels:             <none>
Annotations:        kubectl.kubernetes.io/last-applied-configuration:
                      {"apiVersion":"v1","kind":"Pod","metadata":{"annotations":{},"name":"pod","namespace":"default"},"spec":{"containers":[{"image":"nginx","n...
                    kubernetes.io/limit-ranger: LimitRanger plugin set: cpu, memory request for container nginx; cpu, memory limit for container nginx
Status:             Running
IP:                 172.17.0.6
Containers:
  nginx:
    Container ID:   docker://b1483aab312978d5417b82b78c9efd3586dc9428172b7143dca54c3cac0874eb
    Image:          nginx
    Image ID:       docker-pullable://nginx@sha256:5d32f60db294b5deb55d078cd4feb410ad88e6fe77500c87d3970eca97f54dba
    Port:           <none>
    Host Port:      <none>
    State:          Running
      Started:      Mon, 17 Dec 2018 07:45:29 +0900
    Ready:          True
    Restart Count:  0
    Limits:
      cpu:     100m
      memory:  64Mi
    Requests:
      cpu:        100m
      memory:     32Mi
    Environment:  <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from default-token-g2scz (ro)
Conditions:
  Type              Status
  Initialized       True
  Ready             True
  ContainersReady   True
  PodScheduled      True
Volumes:
  default-token-g2scz:
    Type:        Secret (a volume populated by a Secret)
    SecretName:  default-token-g2scz
    Optional:    false
QoS Class:       Burstable
Node-Selectors:  <none>
Tolerations:     node.kubernetes.io/not-ready:NoExecute for 300s
                 node.kubernetes.io/unreachable:NoExecute for 300s
Events:
  Type    Reason     Age   From               Message
  ----    ------     ----  ----               -------
  Normal  Scheduled  50s   default-scheduler  Successfully assigned default/pod to minikube
  Normal  Pulling    49s   kubelet, minikube  pulling image "nginx"
  Normal  Pulled     46s   kubelet, minikube  Successfully pulled image "nginx"
  Normal  Created    46s   kubelet, minikube  Created container
  Normal  Started    46s   kubelet, minikube  Started container
```

Manifestでは `resources` の指定をしていないが、作成後に設定されていることが分かる。
これはLimitRangeで指定したデフォルト値のものになっている。

さて、CPUの `limits` を `300m` で指定してみよう。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod
spec:
  containers:
  - name: nginx
    image: nginx
    resources:
      limits:
        cpu: 300m
  terminationGracePeriodSeconds: 0
```

上記のManifestで再作成してみる。

```plain
$ kubectl replace --force -f pod.yaml
pod "pod" deleted
Error from server (Forbidden): pods "pod" is forbidden: maximum cpu usage per Container is 200m, but limit is 300m.
```

Containerでの最大値が `200m` のためエラーで作成できなかったことが分かる。

また別のPodを作成してみよう。以下のPodを作成してみる。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app
spec:
  containers:
  - name: nginx
    image: nginx
    resources:
      limits:
        cpu: 200m
        memory: 64Mi
  - name: memcached
    image: memcached
    resources:
      limits:
        cpu: 200m
        memory: 64Mi
  - name: redis
    image: redis
    resources:
      limits:
        cpu: 200m
        memory: 64Mi
  terminationGracePeriodSeconds: 0
```

上記のManifestを適用してみる。

```yaml
$ kubectl apply -f app.yaml
Error from server (Forbidden): error when creating "app.yaml": pods "app" is forbidden: maximum cpu usage per Pod is 500m, but limit is 600m. 
```

Containerでの制限にはかかっていないが、Podで使用しているCPUリソース量が `500m` が超えてしまっているためエラーになった。

この様にLimitRangeでコンテナやPod単体に対してリソースの制限をかけることができる。


--------------------------------------------------


というわけで今回はここまで。

次回はNetworkPolicyについて見ていこう。

それでは。

