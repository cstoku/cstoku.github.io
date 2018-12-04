---
title: Kubernetes道場 5日目 - Volume について

date: 2018-12-05T00:00:00+09:00

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

この記事は [Kubernetes道場 Advent Calendar 2018](https://qiita.com/advent-calendar/2018/k8s-dojo) 5日目の記事です。

今回はPodで使用できるVolumeと、Init Container、コンテナのLifecycleについて。

# Volumeについて

コンテナのデータは一時的なもので、Pod/コンテナが削除されればデータが消えてしまう。
また、コンテナがクラッシュしてKubernetesが再起動させてくれば場合でもコンテナのデータは消えてしまう。

Volumeはデータの永続化をしてくれる。
永続化したいデータは指定したVolumeに保存することで削除やクラッシュした際でもデータが残る。

また、Volumeは別の目的でも使用される。それはPod内でのコンテナ間のデータ共有だ。

[3日目のPodの解説]({{< ref "/posts/2018/k8sdojo-03/index.md" >}}) の際にも出てきた画像だが、以下のようにPod内のコンテナはVolumeを通してデータを共有することが出来る。

{{< img name="pod-arch" size="medium" >}}

Volumeにはいくつかの種類がある。

- [emptyDir](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir)
- [hostPath](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath)
- [configMap](https://kubernetes.io/docs/concepts/storage/volumes/#configmap)
- [secret](https://kubernetes.io/docs/concepts/storage/volumes/#secret)
- [gcePersistentDisk](https://kubernetes.io/docs/concepts/storage/volumes/#gcepersistentdisk)
- [awsElasticBlockStore](https://kubernetes.io/docs/concepts/storage/volumes/#awselasticblockstore)
- [csi](https://kubernetes.io/docs/concepts/storage/volumes/#csi)
- [downwardAPI](https://kubernetes.io/docs/concepts/storage/volumes/#downwardapi)
- [nfs](https://kubernetes.io/docs/concepts/storage/volumes/#nfs)

などなど。

`awsElasticBlockStore` や `gcePersistentDisk` などはクラウドサービスなどを利用してVolumeを作成し、マウントする方法だ。
しかし、これはクラウドを使っている場合においてだ。

minikubeのローカル環境を使用しているため `emptyDir` や `hostPath` などが使用できる。今回は `emptyDir` を使ってVolumeを利用してみよう。

## emptyDirを使う

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: date-tail
spec:
  containers:
  - name: date
    image: alpine
    command: ["sh", "-c"]
    args:
    - |
      exec >> /var/log/date-tail/output.log
      echo -n 'Start at: '
      while true; do
        date
        sleep 1
      done
    volumeMounts:
    - name: log-volume
      mountPath: /var/log/date-tail
  - name: tail
    image: alpine
    command: ["sh", "-c"]
    args:
    - |
      tail -f /var/log/date-tail/output.log
    volumeMounts:
    - name: log-volume
      mountPath: /var/log/date-tail
  volumes:
  - name: log-volume
    emptyDir:
  terminationGracePeriodSeconds: 0
```

このようなyamlを作ってみた。

`emptyDir` を使ったVolumeに `log-volume` という名前を付けた。この名前はPod内でユニークである必要がある。

このVolumeを2つのコンテナにマウントした。`mountPath`(マウント先)は `/var/log/date-tail` としている。
1つ目のコンテナではマウントしたVolumeに `date` の出力を `output.log` に追記している。
もう一つのコンテナではマウントされているVolumeの中にある `output.log` を `tail` している。

さて、作成してみよう。

```plain
$ kubectl apply date-tail.yaml
pod/date-tail created
```

ファイルを確認してみる。

```plain
$ kubectl exec -it date-tail -c date ls /var/log/date-tail
output.log
$ kubectl exec -it date-tail -c tail ls /var/log/date-tail
output.log
```

どちらのコンテナからもファイルが確認できる。
tailコンテナの方では `tail -f` を実行しているので `kubectl logs` でその出力が確認できるはずだ。

```plain
$ kubectl logs date-tail -c tail -f --tail=10
Start at: Tue Dec  4 16:27:55 UTC 2018
Tue Dec  4 16:27:56 UTC 2018
Tue Dec  4 16:27:57 UTC 2018
Tue Dec  4 16:27:58 UTC 2018
Tue Dec  4 16:27:59 UTC 2018
Tue Dec  4 16:28:00 UTC 2018
Tue Dec  4 16:28:01 UTC 2018
Tue Dec  4 16:28:02 UTC 2018
Tue Dec  4 16:28:03 UTC 2018
Tue Dec  4 16:28:04 UTC 2018
Tue Dec  4 16:28:05 UTC 2018
Tue Dec  4 16:28:06 UTC 2018
^C⏎ 
```

この様にファイルに追記されている。Volumeでデータが共有できていることが確認できる。

このコンテナを削除して再作成し、logsでファイルが永続化されているか確認してみる。

```plain
$ kubectl replace --force -f date-tail.yaml
pod "date-tail" deleted
pod/date-tail replaced
$ kubectl logs date-tail -c tail -f
Start at: Tue Dec  4 16:29:39 UTC 2018
Tue Dec  4 16:29:40 UTC 2018
Tue Dec  4 16:29:41 UTC 2018
Tue Dec  4 16:29:42 UTC 2018
Tue Dec  4 16:29:43 UTC 2018
Tue Dec  4 16:29:44 UTC 2018
Tue Dec  4 16:29:45 UTC 2018
Tue Dec  4 16:29:46 UTC 2018
Tue Dec  4 16:29:47 UTC 2018
Tue Dec  4 16:29:48 UTC 2018
Tue Dec  4 16:29:49 UTC 2018
Tue Dec  4 16:29:50 UTC 2018
^C⏎ 
```

Start atの日時が違うようだ。このことから永続化されていないことが分かる。

実は `emptyDir` はPodが削除された際に対象のVolumeのデータも削除される。
よってコンテナ間のデータ共有のみで使用できる。

このため永続化も行いたい場合、minikubeでは `hostPath` を使用する。

その前にお片付け。

```plain
$ kubectl delete -f date-tail.yaml
pod "date-tail" deleted
```

# hostPathを使う

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: date-tail
spec:
  containers:
  - name: date
    image: alpine
    command: ["sh", "-c"]
    args:
    - |
      exec >> /var/log/date-tail/output.log
      echo -n 'Start at: '
      while true; do
        date
        sleep 1
      done
    volumeMounts:
    - name: log-volume
      mountPath: /var/log/date-tail
  - name: tail
    image: alpine
    command: ["sh", "-c"]
    args:
    - |
      tail -f /var/log/date-tail/output.log
    volumeMounts:
    - name: log-volume
      mountPath: /var/log/date-tail
  volumes:
  - name: log-volume
    hostPath:
      path: /data/date-tail
  terminationGracePeriodSeconds: 0
```

volumeのタイプを `hostPath` に変更して、 `path` に `/data/date-tail` を指定した。

minikubeでは以下のパスが使用できるようになっている。

- `/data`
- `/var/lib/minikube`
- `/var/lib/docker`
- `/tmp/hostpath_pv`
- `/tmp/hostpath-provisioner`

詳細は以下から。

[Persistent Volumes](https://github.com/kubernetes/minikube/blob/master/docs/persistent_volumes.md)

ここ話を掘り下げると長くなるのでこの話については後日掘り下げるかも。

一旦はminikubeで上記のパス以下で `path` を指定すれば良い。

さて、Podを作成してみる。

```plain
$ kubectl logs date-tail -c tail
Start at: Tue Dec  4 16:48:07 UTC 2018
Tue Dec  4 16:48:08 UTC 2018
Tue Dec  4 16:48:09 UTC 2018
Tue Dec  4 16:48:10 UTC 2018
Tue Dec  4 16:48:11 UTC 2018
Tue Dec  4 16:48:12 UTC 2018
Tue Dec  4 16:48:13 UTC 2018
Tue Dec  4 16:48:14 UTC 2018
Tue Dec  4 16:48:15 UTC 2018
```

ここまでは今までどおり。さて、ここで再作成してみよう。

```plain
$ kubectl replace --force -f date-tail.yaml
pod "date-tail" deleted
pod/date-tail replaced
$ kubectl logs date-tail -c tail
Tue Dec  4 16:48:42 UTC 2018
Tue Dec  4 16:48:43 UTC 2018
Tue Dec  4 16:48:44 UTC 2018
Tue Dec  4 16:48:45 UTC 2018
Tue Dec  4 16:48:46 UTC 2018
Tue Dec  4 16:48:47 UTC 2018
Start at: Tue Dec  4 16:48:49 UTC 2018
Tue Dec  4 16:48:50 UTC 2018
Tue Dec  4 16:48:51 UTC 2018
Tue Dec  4 16:48:52 UTC 2018
Tue Dec  4 16:48:53 UTC 2018
Tue Dec  4 16:48:54 UTC 2018
```

Start atの前にログが出力されており、データが永続化されていることが分かる。

この `hostPath` はKubernetesが実行されているサーバーにデータが置いてある。確認してみよう。

minikubeでは `minikube ssh` というコマンドでminikubeで構築したローカル環境のVMにSSHで接続できる。

```plain
$ minikube ssh
                         _             _
            _         _ ( )           ( )
  ___ ___  (_)  ___  (_)| |/')  _   _ | |_      __
/' _ ` _ `\| |/' _ `\| || , <  ( ) ( )| '_`\  /'__`\
| ( ) ( ) || || ( ) || || |\`\ | (_) || |_) )(  ___/
(_) (_) (_)(_)(_) (_)(_)(_) (_)`\___/'(_,__/'`\____)
$ ls /data/
date-tail  minikube
$ ls /data/date-tail/
output.log
$ tail -n5 /data/date-tail/output.log
Tue Dec  4 17:02:46 UTC 2018
Tue Dec  4 17:02:47 UTC 2018
Tue Dec  4 17:02:48 UTC 2018
Tue Dec  4 17:02:49 UTC 2018
Tue Dec  4 17:02:50 UTC 2018
```

`hostPath` はサーバー上のファイルシステムにデータを保存するため、実際のKubernetesクラスタでは今回のような期待した動きにならない。
別のサーバーでPodが起動した場合に、そのサーバーの `hostPath` にはデータが存在しないためだ。

このため、実際のKubernetesクラスタでは

- [gcePersistentDisk](https://kubernetes.io/docs/concepts/storage/volumes/#gcepersistentdisk)
- [awsElasticBlockStore](https://kubernetes.io/docs/concepts/storage/volumes/#awselasticblockstore)
- [csi](https://kubernetes.io/docs/concepts/storage/volumes/#csi)
- [nfs](https://kubernetes.io/docs/concepts/storage/volumes/#nfs)

のようなマネージドのストレージやファイルサーバーなどを使ってVolumeとして使用する。こちらの使用例については今後機会があれば解説しようと思う。


--------------------------------------------------


というわけで今回はここまで。

次回は `init_container` と `lifecycle` について見ていこう。

それでは。

