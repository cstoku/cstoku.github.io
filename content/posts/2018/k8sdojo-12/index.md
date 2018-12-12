---
title: Kubernetes道場 12日目 - PersistentVolume / PersistentVolumeClaim / StorageClassについて

date: 2018-12-12T00:00:00+09:00

tags:
- kubernetes
- advent-calendar-2018
- kubernetes-dojo

resources:
- name: thumbnail
  src: header.jpg
- name: pv-fig
  src: pv-fig.jpg

---

この記事は [Kubernetes道場 Advent Calendar 2018](https://qiita.com/advent-calendar/2018/k8s-dojo) 12日目の記事です。

今回はPersistentVolumeとPersistentVolumeClaimとStorageClassについて。

# 永続化ボリュームについて

Kubernetesの永続化ボリュームについて、まず各オブジェクトについてどのようなものかを解説しよう。

## 永続化ボリュームに関するオブジェクト

### StorageClass

StorageClassはストレージの種類を示すオブジェクトだ。例えば、通常・高可用性・高スループットなどだ。

また、プロビジョニングという永続化ボリュームを動的に作成する設定もこのStorageClassに行う。

### PersistentVolume

字の通り、PersistentVolume(PV)は永続化ボリュームそれ自体についてのオブジェクトだ。

StorageClassを元に動的に作成されたものや、Kubernetes管理者によって追加されたボリュームも含まれる。

永続化ボリュームの種類は多くあり、それらについては以下のリンクを参考にしてほしい。

[Types of Persistent Volumes - Persistent Volumes - Kubernetes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#types-of-persistent-volumes)

今回はローカル環境のminikubeを使用していることもあり、シングルノードのテスト向けである `HostPath` を主に見ていく。

### PersistentVolumeClaim

PersistentVolumeClaim(PVC)は永続化ボリュームの利用請求をするオブジェクトだ。

永続化ボリュームを使用する際は、このPersistentVolumeClaimリソースを作成する。

その後、クレームに従ったものが自動的にプロビジョニングされるか、Kubernetesの管理者がクレームに従ったものを作成するかをして永続化ボリュームが払い出される。

## 全体の関係図

全体の大まかな関係図は以下のようになる。

{{< img name="pv-fig" >}}

## 各設定項目について 

各オブジェクトのざっくりとした関係性は分かったと思うので、次は各オブジェクトの設定項目を見ていこう。

### StorageClass

##### provisioner

Provisionerを指定する。

- `kubernetes.io/gce-pd`
- `kubernetes.io/aws-ebs`
- `kubernetes.io/glusterfs`

など。詳しくは以下のドキュメントへ。

[Provisioner - Storage Classes - Kubernetes](https://kubernetes.io/docs/concepts/storage/storage-classes/#provisioner)

このProvisionerは自前のものを実装して組み込むことが可能だ。

それはまた別の機会に。

##### parameters

ProvisionerのパラメータをKey/Valueの形式で指定する。

詳しくは以下のドキュメントへ。

[Provisioner - Storage Classes - Kubernetes](https://kubernetes.io/docs/concepts/storage/storage-classes/#parameters)

##### reclaimPolicy

PVCが削除された際にPVを削除( `Delete` )するか残すか( `Retain` )を指定する。

デフォルトは `Delete` だ。

##### volumeBindingMode

PVCが作成された際に、即時にPVを紐付けるか( `Immediate` )、実際使用される際に紐付けるか( `WaitForFirstConsumer` )を指定する。

`WaitForFirstConsumer` だとPVCが作成された際にはまだPVが作成されたりBindされたりしない。PVCが実際にPodで利用される際に作成・Bindingが行われるようになる。

デフォルトは `Immediate` だ。

##### mountOptions

StorageClassによって動的に作成される際のマウントオプションを指定する。

このオプションはチェックされず、無効なオプションの場合単に処理が失敗する。

##### allowVolumeExpansion

ボリュームの拡張を許可するかを指定する。

デフォルトはFalseだ。

##### allowedTopologies

動的にプロビジョニングする際の対象Nodeを制限することが出来る。 `matchLabelExpressions` でNodeのトポロジーを指定をする。


### PersistentVolume

PVは殆どが各Volumeの設定についてのフィールドだ。共通で使用するフィールドのみ解説する。

##### accessModes

PVのアクセスモードを指定する。アクセスモードは現在以下の3種類。

- `ReadWriteOnce` : 単一Nodeで読み書きが可能
- `ReadOnlyMany` : 複数Nodeで読み込みが可能
- `ReadWriteMany` : 複数Nodeから読み書きが可能

使用するボリュームによってサポートが変わるので以下のリンクから要確認だ。

[Access Modes - Persistent Volumes - Kubernetes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#access-modes)

##### capacity

PVの容量を指定する。指定方法はKeyに `storage` 、ValueはResourceRequirementでMemoryの容量を指定するのに近い。以下が例だ。

```yaml
capacity:
  storage: 5Gi
```

##### mountOptions

StorageClassのフィールドと同様。

##### persistentVolumeReclaimPolicy

StorageClassの `reclaimPolicy` と同様。

##### storageClassName

PVのStorageClassを指定する。空の場合どのStorageClassにも属さないPVとして扱われる。

##### volumeMode

PVをファイルシステム( `Filesystem` )としてマウントさせるか、ブロックデバイス( `Block` )としてマウントさせるかを指定する。

デフォルトは `Filesystem` だ。

### PersistentVolumeClaim

##### resources

最低限必要なボリュームの容量を指定する。指定方法はResourceRequirementsとほど同様だ。以下が指定方法の例だ。

```yaml
resources:
  requests:
    storage: 5Gi
```

ここで指定した容量より大きいPVがBindingされることもある。

##### selector

PVのBindingでLabel Selectorを利用できる。 Deploymentなどでも使用した `matchLabels` や `matchLabelExpressions` か指定できる。

##### PVと同様のフィールド

- accessModes
- storageClassName
- volumeMode

# Persistent Volumeを使ってみる

さて、APIドキュメントの翻訳みたいになってしまったが、ここからは例を出してどのような動きをするか見てみる。

##  PV / PVCを使ってPodにマウントする

まず、PVを作成しよう。PVCを作ってもPV自体が無いと何も始まらない。

以下のようなPVを作成した。

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv0001
spec:
  capacity:
    storage: 1Gi
  volumeMode: Filesystem
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: slow
  hostPath:
    path: /data/pv0001
    type: DirectoryOrCreate
```

今回はPVにhostPathを使用している。使用方法はPodでVolumeを使用した際と同様だ。

minikubeでは `/data` がVolumeとして使用できるようになっているので、そこにフォルダを一つ切ってPVとして使用することにする。

さて、上記のManifestを適用してみる。

```plain
$ kubectl apply -f pv0001.yaml
persistentvolume/pv0001 created
```

作成できたようだ。確認してみよう。

```plain
kubectl get pv
NAME     CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM   STORAGECLASS   REASON   AGE
pv0001   1Gi        RWO            Delete           Available           slow                    90s
```

指定通りに作成できているようだ。また、STATUSからPVが有効な状態だということも分かる。

今回作成したPVのStorageClassを `slow` とした。(名前に特に意味はない)

さて、このStorageClassを請求するPVCを作成しよう。今作成したPVがBindingされるはずだ。

以下のようなManifestを作成した。

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pv-slow-claim
spec:
  accessModes:
    - ReadWriteOnce
  volumeMode: Filesystem
  resources:
    requests:
      storage: 1Gi
  storageClassName: slow
```

StorageClassに `slow` を指定し、容量のリクエストも `1Gi` にしている。

さて、このManifestを適用してPVとPVCを確認してみよう。

```plain
$ kubectl apply -f pvc.yaml
persistentvolumeclaim/pv-slow-claim created
$ kubectl get pv,pvc
NAME                      CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                   STORAGECLASS   REASON   AGE
persistentvolume/pv0001   1Gi        RWO            Delete           Bound    default/pv-slow-claim   slow                    6m24s

NAME                                  STATUS   VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
persistentvolumeclaim/pv-slow-claim   Bound    pv0001   1Gi        RWO            slow           42s
```

PVCを作成したら先程作成したPVがBindingされたのがSTATUSから分かるだろう。

それではこのPVCを元にPodを作成し、マウントしてみよう。

以下のようなManifestを作成した。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pvc-slow-test
spec:
  containers:
  - image: alpine
    name: alpine
    command: ["tail", "-f", "/dev/null"]
    volumeMounts:
    - name: claim-volume
      mountPath: /data
  volumes:
  - name: claim-volume
    persistentVolumeClaim:
      claimName: pv-slow-claim
  terminationGracePeriodSeconds: 0
```

Podにマウントする際は、 `spec.volumes[].persistentVolumeClaim.claimName` に作成したPVCの名前を指定する。あとは今までどおりのボリュームマウントと同様だ。

さて、上記のManifestを適用して確認してみよう。

```plain
$ kubectl apply -f pvc-slow-test.yaml
pod/pvc-slow-test created
$ kubectl exec pvc-slow-test -- ls -l /
total 56
drwxr-xr-x    2 root     root          4096 Sep 11 20:23 bin
drwxr-xr-x    2 root     root          4096 Dec 12 08:43 data
drwxr-xr-x    5 root     root           360 Dec 12 08:43 dev
drwxr-xr-x    1 root     root          4096 Dec 12 08:43 etc
drwxr-xr-x    2 root     root          4096 Sep 11 20:23 home
drwxr-xr-x    5 root     root          4096 Sep 11 20:23 lib
drwxr-xr-x    5 root     root          4096 Sep 11 20:23 media
drwxr-xr-x    2 root     root          4096 Sep 11 20:23 mnt
dr-xr-xr-x  136 root     root             0 Dec 12 08:43 proc
drwx------    2 root     root          4096 Sep 11 20:23 root
drwxr-xr-x    1 root     root          4096 Dec 12 08:43 run
drwxr-xr-x    2 root     root          4096 Sep 11 20:23 sbin
drwxr-xr-x    2 root     root          4096 Sep 11 20:23 srv
dr-xr-xr-x   12 root     root             0 Dec 12 08:43 sys
drwxrwxrwt    2 root     root          4096 Sep 11 20:23 tmp
drwxr-xr-x    7 root     root          4096 Sep 11 20:23 usr
drwxr-xr-x   11 root     root          4096 Sep 11 20:23 var
$ kubectl exec pvc-slow-test -- ls -l /data
total 0
```

`/data` にマウント出来ていることが分かる。が、ちょっと達成感が・・・ :sweat_smile:


##  PVC / StorageClassをPVを動的にProvisioningする

先程もStorageClassを指定はしたが、StorageClassの名前を指定しただった。

今回は動的なProvisioningを試してみよう。

実はデフォルトでStorageClassが定義されている。確認してみよう。

```plain
$ kubectl get sc
NAME                 PROVISIONER                AGE
standard (default)   k8s.io/minikube-hostpath   9h
$ kubectl get sc/standard -o yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"storage.k8s.io/v1","kind":"StorageClass","metadata":{"annotations":{"storageclass.beta.kubernetes.io/is-default-class":"true"},"labels":{"addonmanager.kubernetes.io/mode":"Reconcile"},"name":"standard","namespace":""},"provisioner":"k8s.io/minikube-hostpath"}
    storageclass.beta.kubernetes.io/is-default-class: "true"
  creationTimestamp: "2018-12-11T23:22:57Z"
  labels:
    addonmanager.kubernetes.io/mode: Reconcile
  name: standard
  resourceVersion: "421"
  selfLink: /apis/storage.k8s.io/v1/storageclasses/standard
  uid: b15dec7f-fd9b-11e8-81da-a89e63bcdf60
provisioner: k8s.io/minikube-hostpath
reclaimPolicy: Delete
volumeBindingMode: Immediate 
```

Standardという名前のStorageClassが定義されていることが分かる。

また、provisionerに `k8s.io/minikube-hostpath` が指定されている。このStorageClassを使用することで動的にPVが作成されそうだ。
(ここの処理は追うと素晴らしく長くなってしまうのでまたの機会に。)

それではこのStorageClassを使ったPVCを作成しよう。

以下のようなManifestを作成した。

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pv-standard-claim
spec:
  accessModes:
    - ReadWriteOnce
  volumeMode: Filesystem
  resources:
    requests:
      storage: 1Gi
  storageClassName: standard
```

重要なのは `storageClassName` に先程あったStorageClassの `standard` を指定することだ。

と、言いたいが、実はデフォルトでこのStorageClassが使用されるように設定されている。なので `storageClassName` を省略するとStorageClassが `standard` で作成される。

また省略した場合であって、空文字を指定した場合は別の解釈がされるので要注意。

それでは適用して確認してみよう。

```plain
$ kubectl apply -f pv-standard-claim.yaml
persistentvolumeclaim/pv-standard-claim created
$ kubectl get pv,pvc
NAME                                                        CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                       STORAGECLASS   REASON   AGE
persistentvolume/pvc-348227f2-fdec-11e8-81da-a89e63bcdf60   1Gi        RWO            Delete           Bound    default/pv-standard-claim   standard                11s

NAME                                      STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
persistentvolumeclaim/pv-standard-claim   Bound    pvc-348227f2-fdec-11e8-81da-a89e63bcdf60   1Gi        RWO            standard       12s
```

この様にPVCを作成しただけでPVが払い出され、Bindingされている状態になっているのが分かる。便利。


## volumeBindingModeについて

ここまでできていれば十分な気もするが、せっかくなので `volumeBindingMode` についても少し見ておこう。

先程PVとPVCを作成した時やStorageClassを `standard` で作成したPVCは作成されてすぐにBindingされていた。

これだと先程もそうだったが、1度も実際にPodにマウントをして利用をしていないのにPVのリソースを取ってしまっている状態だ。

これを実際に使うときまで(Schedulingされるまで)遅延させてくれるのがこの `volumeBindingMode` だ。

デフォルトでは今までのように作成されてすぐにBindingする `Immediate` なのだが、実際にSchedulingされるまで遅延させるのが `WaitForFirstConsumer` だ。

挙動を確認してみよう。

実はこの `WaitForFirstConsumer` と動的なProvisioningが同時に出来るボリュームタイプは現状以下の3つだけだ。

- AWSElacticBlockStore( `kubernetes.io/aws-ebs` )
- GCEPersistentDisk( `kubernetes.io/gce-pd` )
- AzureDisk( `kubernetes.io/azure-disk` )

今回ローカル環境で使用しているminikubeではこのボリュームタイプは対応していないため、 `provisioner` には `kubernetes.io/no-provisioner` を使用する。

さて、上記の内容に従って以下のようなStorageClassのManifestを作成した。

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: delay-bind
provisioner: kubernetes.io/no-privisioner
volumeBindingMode: WaitForFirstConsumer
```

また、このStorageClassに従ったPVも作成する。

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-delay-bind
spec:
  accessModes:
  - ReadWriteOnce
  capacity:
    storage: 1Gi
  hostPath:
    path: /data/pv-delay-bind
    type: DirectoryOrCreate
  persistentVolumeReclaimPolicy: Delete
  storageClassName: delay-bind
```

これらを適用してみる。

```yaml
$ kubectl apply -f delay-bind.yaml -f pv-delay-bind.yaml
storageclass.storage.k8s.io/delay-bind created
persistentvolume/pv-delay-bind created 
```

それではこのStorageClassを請求するPVCを作成しよう。

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pv-delay-bind-claim
spec:
  accessModes:
  - ReadWriteOnce
  volumeMode: Filesystem
  resources:
    requests:
      storage: 1Gi
  storageClassName: delay-bind
```

さて、このManifestを適用してPVとPVCを確認してみよう。

```plain
$ kubectl apply -f pv-delay-bind-claim.yaml
persistentvolumeclaim/pv-delay-bind-claim created
$ kubectl get pv,pvc
NAME                             CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM   STORAGECLASS   REASON   AGE
persistentvolume/pv-delay-bind   1Gi        RWO            Delete           Available           delay-bind              61m

NAME                                        STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
persistentvolumeclaim/pv-delay-bind-claim   Pending                                      delay-bind     5s
```

リソースを取得するとPVのSTATUSはAvailableでまだBindingされていない状態だ。また、PVCのほうはSTATUSがPendingになっている。

このように `volumeBindingMode` を `WaitForFirstConsumer` にするとPVCを作成しただけではBindingにはならない。

それではPodのボリュームとして使ってみてどうなるか見てみよう。以下のManifestを作成する。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pv-delay-bind-test
spec:
  containers:
  - image: alpine
    name: alpine
    command: ["tail", "-f", "/dev/null"]
    volumeMounts:
    - name: claim-volume
      mountPath: /data
  volumes:
  - name: claim-volume
    persistentVolumeClaim:
      claimName: pv-delay-bind-claim
  terminationGracePeriodSeconds: 0
```

さて、このManifestを適用してPVとPVCの状態を確認してみよう。

```plain
$ kubectl apply -f pv-delay-bind-test.yaml
pod/pv-delay-bind-test created
$ kubectl get po,pv,pvc
NAME                     READY   STATUS    RESTARTS   AGE
pod/pv-delay-bind-test   1/1     Running   0          43s

NAME                             CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                         STORAGECLASS   REASON   AGE
persistentvolume/pv-delay-bind   1Gi        RWO            Delete           Bound    default/pv-delay-bind-claim   delay-bind              67m

NAME                                        STATUS   VOLUME          CAPACITY   ACCESS MODES   STORAGECLASS   AGE
persistentvolumeclaim/pv-delay-bind-claim   Bound    pv-delay-bind   1Gi        RWO            delay-bind     6m1s
```

PodでPVCが利用されるようになり、PVがBindingされた。

今作成したPodが最初のConsumerとして扱われ、PVCとPVがBindingされた。

この機能は最初にも書いたが、実際に利用するまでPVのBindingや動的なProvisioningであればPVの確保も遅らせることができ、リソースの節約になる。


--------------------------------------------------


というわけで今回はここまで。

次回はStatefulSet / DaemonSetについて見ていこう。

それでは。

