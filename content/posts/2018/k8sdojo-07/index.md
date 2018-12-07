---
title: Kubernetes道場 7日目 - Resource Requirements / Security Contextについて

date: 2018-12-07T00:00:00+09:00
draft: true

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

### fsGroup

integer A special supplemental group that applies to all containers in a pod. Some volume types allow the Kubelet to change the ownership of that volume to be owned by the pod: 1. The owning GID will be the FSGroup 2. The setgid bit is set (new files created in the volume will be owned by FSGroup) 3. The permission bits are OR'd with rw-rw---- If unset, the Kubelet will not modify the ownership and permissions of any volume.

### runAsGroup

integer The GID to run the entrypoint of the container process. Uses runtime default if unset. May also be set in SecurityContext. If set in both SecurityContext and PodSecurityContext, the value specified in SecurityContext takes precedence for that container.boolean    Indicates that the container must run as a non-root user. If true, the Kubelet will validate the image at runtime to ensure that it does not run as UID 0 (root)

### runAsNonRoot

boolean Indicates that the container must run as a non-root user. If true, the Kubelet will validate the image at runtime to ensure that it does not run as UID 0 (root) and fail to start the container if it does. If unset or false, no such validation will be performed. May also be set in SecurityContext. If set in both SecurityContext and PodSecurityContext, the value specified in SecurityContext takes precedence.

### runAsUser

integer The UID to run the entrypoint of the container process. Defaults to user specified in image metadata if unspecified. May also be set in SecurityContext. If set in both SecurityContext and PodSecurityContext, the value specified in SecurityContext takes precedence for that container.

### seLinuxOptions

SELinuxOptions  The SELinux context to be applied to all containers. If unspecified, the container runtime will allocate a random SELinux context for each container. May also be set in SecurityContext. If set in both SecurityContext and PodSecurityContext, the value specified in SecurityContext takes precedence for that container.

### supplementalGroups

integer array   A list of groups applied to the first process run in each container, in addition to the container's primary GID. If unspecified, no groups will be added to any container.

### sysctls

Sysctl array    Sysctls hold a list of namespaced sysctls used for the pod. Pods with unsupported sysctls (by the container runtime) might fail to launch.


## ContainerのSecurity Context

### allowPrivilegeEscalation

boolean AllowPrivilegeEscalation controls whether a process can gain more privileges than its parent process. This bool directly controls if the no_new_privs flag will be set on the container process. AllowPrivilegeEscalation is true always when the container is: 1) run as Privileged 2) has CAP_SYS_ADMIN

### capabilities

Capabilities    The capabilities to add/drop when running containers. Defaults to the default set of capabilities granted by the container runtime.

### privileged

boolean Run container in privileged mode. Processes in privileged containers are essentially equivalent to root on the host. Defaults to false.

### procMount

string  procMount denotes the type of proc mount to use for the containers. The default is DefaultProcMount which uses the container runtime defaults for readonly paths and masked paths. This requires the ProcMountType feature flag to be enabled.

### readOnlyRootFilesystem

Whether this container has a read-only root filesystem. Default is false.

### PodのSecurity Contextにもある項目

- runAsGroup
- runAsNonRoot
- runAsUser
- seLinuxOptions


## Security Contextを使った例






--------------------------------------------------


というわけで今回はここまで。

次回はReplicaSetとDeploymentについて見ていこう。

それでは。

