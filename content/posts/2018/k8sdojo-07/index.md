---
title: Kubernetes道場 7日目 - Resource Requirements / Security Contextについて

date: 2018-12-07T00:00:00+09:00

tags:
- kubernetes
- advent-calendar-2018
- kubernetes-dojo

resources:
- name: thumbnail
  src: header.jpg

---

この記事は [Kubernetes道場 Advent Calendar 2018](https://qiita.com/advent-calendar/2018/k8s-dojo) 7日目の記事です。

今回はPodで指定できるResource RequirementsとSecurity Contextについて。

リソースやセキュリティ系の話で堅い感じになりそうだが、お付き合いいただければと。

# Resource Requirementsについて

PodはPod内のコンテナに対してリソースの要求や制限を指定することが出来る。

指定できるリソースは以下のとおりである。

- CPU
- Memory

リソースといえばこの2つであろう、予想できたとは思う。
しかし実はこれ以外にも `ephemeral-storage` というローカルに用意される一時記憶領域の要求、制限も設定することが出来るのだが、
これはv1.13のバージョンでBetaの機能なのでここでの説明は省く。

まずは上記2つのリソース量の指定方法についてだ。

## リソース料の指定方法

### CPUの指定

CPUのリソース指定はCPU単位で指定する。大体の場合はCPUのコア単位になる。クラウドなどではvCPUなどの単位で扱われるだろう。

また、 `0.5` のように小数点以下での指定や `100m` のようなミリ単位での指定が可能だ。

以下が表記の例となる。

```plain
4
0.5
100m
```

### Memoryの指定

Memoryのリソース指定はバイト単位で指定をする。

また、 `e` を使った指数表記や10の累乗の接尾辞である `E / P / T / G / M / K` 、2の累乗の接尾辞の `Ei / Pi / Ti / Gi / Mi / Ki` を用いた指定も可能だ。

以下が表記の例となる。

```plain
134217728
129e6
64M
512Mi
```

通常は `Mi / Gi` 辺りを使用することが多い。

## リソースの要求・制限の指定

さて、実際にリソースの要求・制限を指定してみる。

Resource Requirementsは `spec.containers[].resources` に指定する。

リソースの要求は `requests` に指定する。以下が `spec.containers[].resources` の部分を切り出した例だ。

```yaml
resources:
  requests:
    cpu: 100m
    memory: 64Mi
```

また、リソースの制限は `limits` に指定する。以下が `spec.containers[].resources` の部分を切り出した例だ。

```yaml
resources:
  limits:
    cpu: 2
    memory: 1Gi
```

もちろん要求と制限を同時に指定することも可能だ。

```yaml
resources:
  requests:
    cpu: 100m
    memory: 64Mi
  limits:
    cpu: 2
    memory: 1Gi
```

Podに対してResource Requirementsを指定した例を載せておく。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
  - image: nginx
    name: nginx
    resources:
      requests:
        cpu: 50m
        memory: 8Mi
      limits:
        cpu: 200m
        memory: 64Mi
```

## リソースの要求(requests)と制限(limits)の違い

タイトルを見ればその言葉の違いは一目瞭然だが、いざManifestを書いてみるとどっちがどうだったっけ？という現象に落ちる。(自分は困惑したことがある:innocent:)

リソースの要求(requests)はコンテナがスケジュールされ起動した際に、指定されたリソース量が確保・保証されている。
こう書くと難しいかも知れないので、要はコンテナで使う最低限のリソースと覚えてもらうと良いと思う。

また、 リソースの制限は(limits)はコンテナがリソースを多く使用しようとした際の上限を設けれる。
要はコンテナで使うリソースの最大値と覚えてもらうと良いと思う。

### リソースの要求と制限を片方だけ指定した場合の挙動

#### リソース要求(requests)のみ指定した場合

`requests` のみを指定した場合は、リソースの制限について無制限となる。が、実際の所はスケジュールされた先のNodeの確保できるリソースが上限になる。

#### リソース制限(limits)のみ指定した場合

`limits` のみを指定した場合は、`requests` が `limits` と同値に設定される。

```yaml
resources:
  limits:
    cpu: 2
    memory: 1Gi
```

上記のように指定した場合、実際には以下のようになる。

```yaml
resources:
  limits:
    cpu: 2
    memory: 1Gi
  requests:
    cpu: 2
    memory: 1Gi
```
 
## Resource Requirementsのまとめ

Podのコンテナにリソースの要求( `requests` )と制限( `limits` )を設定することが出来る。

- 要求はコンテナの最低限必要なリソース量
- 制限はコンテナの最大限使用できるリソース量

と覚えてもらえればと思う。

また、ここの話は後日 `ResourceQuota` やResource QoSの解説の際にスケジューリングについてなどと合わせてもう少し掘り下げて解説しようと思う。

一旦Resource Requirementsについてはここまでとしよう。

# Security Context

Security ContextはPodやコンテナに対して権限やアクセス制御の設定を指定する。Security Contextには以下の設定が行える。

- DAC(Discretionary Access Control)による権限制御。ファイルのようなオブジェクトに対してUser ID(UID)やGroup ID(GID)を元に設定する
- SELinuxのコンテキストの適用
- 特権モードの設定
- Capabilityの付与
- 特権昇格の有無
- AppArmor / Seccompのプロファイルの適用

最後のAppArmor / Seccompのプロファイル適用は順にbeta, alphaの機能でannotationを使うものになっている(分かる人向け・・・)。
なので今回は解説の対象から省くことにする。知りたい方は以下のリンクへどうぞ。

[API Reference - AppArmor - Kubernetes](https://kubernetes.io/docs/tutorials/clusters/apparmor/#api-reference)

[Seccomp - Pod Security Policies - Kubernetes](https://kubernetes.io/docs/concepts/policy/pod-security-policy/#seccomp)

さて、それではPodに指定できるSecurity Contextを見ていこう。

## PodのSecurity Context

### runAsUser

コンテナのプロセスのUIDを指定する。指定されていない場合はコンテナイメージに指定されているものを使う。

### runAsGroup

コンテナのプロセスのGIDを指定する。指定されていない場合は実行時のデフォルトが使用される。

### supplementalGroups

コンテナのプロセスのGIDに加えて追加したいgroupsをリストで指定する。

### runAsNonRoot

Trueを指定した場合、コンテナのプロセスがRootで動いてるかをチェックする。Rootで動作した場合、起動に失敗する。

### fsGroup

特殊なグループを追加し、Pod内の全てのコンテナに適用する。
このフィールドを指定した場合、KubernetesはPodに対して以下の設定をする。

1. VolumeのGIDに `fsGroup` で指定されたものをセット
2. setgidビットをセット
3. パーミッションの設定を `rw-rw----` (0660)でORを取りセット

指定されなかった場合、KubernetesはVolumeのオーナーやパーミッションを変更しない。

これについては例を出しておこう。 以下のManifestでPodを作成してみる。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: fsgroup-test
spec:
  containers:
  - image: alpine
    name: alpine
    command: ["tail", "-f", "/dev/null"]
    volumeMounts:
    - name: data
      mountPath: /data
  volumes:
  - name: data
    emptyDir:
  terminationGracePeriodSeconds: 0
```

作成してVolumeをマウントしたパスの権限とプロセスのグループを確認しよう。

```plain
$ kubectl apply -f fsgroup-test.yaml
pod "fsgroup-test" created
$ kubectl exec -it fsgroup-test -- ls -l / | grep data
drwxrwxrwx    2 root     root          4096 Dec  7 17:37 data
$ kubectl exec -it fsgroup-test -- id -G
0 1 2 3 4 6 10 11 20 26 27
```

rootでマウントされている事がわかる。

さて、 `fsGroup` を使ったManifestに変更して再作成してみる。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: fsgroup-test
spec:
  containers:
  - image: alpine
    name: alpine
    command: ["tail", "-f", "/dev/null"]
    volumeMounts:
    - name: data
      mountPath: /data
  securityContext:
    fsGroup: 1000
  volumes:
  - name: data
    emptyDir:
  terminationGracePeriodSeconds: 0
```

再度、Volumeをマウントしたパスの権限とプロセスのグループを確認しよう。

```plain
$ kubectl replace --force -f pod.yaml
pod "fsgroup-test" deleted
pod "fsgroup-test" replaced
$ kubectl exec -it fsgroup-test -- ls -l / | grep data
drwxrwsrwx    2 root     1000          4096 Dec  7 17:52 data
$ kubectl exec -it fsgroup-test -- id -G
0 1 2 3 4 6 10 11 20 26 27 1000
```

上記の通り、 `fsGroup` で指定した1000のGIDでマウントされ、ユーザーのGroupに追加されている。

emptyDirだと `0777` の権限でマウントされているので特に有り難みが薄いが、別のVolumeを使用した際などには便利に使えるフィールドだ。


### seLinuxOptions

SELinuxのコンテキストを指定する。指定されなかった場合はランダムなコンテキストが割り当てられる。

### sysctls

sysctlのパラメータをリストで指定する。コンテナランタイムがサポートしてない場合は起動に失敗する。


## コンテナのSecurity Context

### allowPrivilegeEscalation

親プロセスよりも多くの権限を取得できるようになるかを指定する。
特権モードで実行されていて `CAP_SYS_ADMIN` のCapabilityをもつ場合、このパラメータは常にTrueになる。

### capabilities

Capabilityの追加や削除を指定できる。デフォルトはコンテナランタイムから指定されているものが設定される。

`add` と `drop` というフィールドにリストで指定する。以下が例だ。

```yaml
capabilities:
  add:
  - CAP_SETUID
  - CAP_SETGID
  drop:
  - CAP_SYS_ADMIN
```

### privileged

コンテナを特権モードで動作させるかを指定する。特権モードのコンテナのプロセスは基本的にホスト上のrootと同等の権限を持つ。

### procMount

コンテナのprocマウントのタイプを指定する。デフォルトはDefaultProcMountが使用される。指定できるのは現状は以下の2つだ。

- `Default` : DefaultProcMountは/procをマスクし、ReadOnlyにする。
- `Unmasked` : UnmaskedProcMountは/procのマスク処理をバイパスする。

通常はDefaultProcMountで問題ないはずだ。

### readOnlyRootFilesystem

コンテナのルートファイルシステムを読み込み専用にするかを指定する。デフォルトはFalse。

### PodのSecurity Contextにもある項目について

コンテナのSecurity ContextにはPodと同様のフィールドが指定できる。

- runAsUser
- runAsGroup
- runAsNonRoot
- seLinuxOptions

これらのフィールドをコンテナのSecurity Contextに指定した場合はコンテナのSecurity Contextが優先されて使用される。

## Security Contextを使った例

Security Contextを使ったManifestの例をいかに示しておく。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: sc-test
spec:
  containers:
  - image: memcached
    name: memcached
    securityContext:
      runAsUser: 11211
      runAsNonRoot: true
      readOnlyRootFilesystem: true
      capabilities:
        drop:
        - SYS_ADMIN
        - NET_ADMIN
```


--------------------------------------------------


というわけで今回はここまで。

次回はReplicaSetとDeploymentについて見ていこう。

それでは。

