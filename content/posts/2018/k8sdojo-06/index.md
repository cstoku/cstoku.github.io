---
title: Kubernetes道場 6日目 - Init Container /  Lifecycleについて

date: 2018-12-06T00:00:00+09:00
draft: true

tags:
- kubernetes
- advent-calendar-2018
- kubernetes-dojo

resources:
- name: thumbnail
  src: header.jpg
- name: pod-lifecycle
  src: pod-lifecycle.jpg

---

この記事は [Kubernetes道場 Advent Calendar 2018](https://qiita.com/advent-calendar/2018/k8s-dojo) 6日目の記事です。

今回はPodで指定できるInit ContainerとPodのLifecycleについて。

# Init Containerについて

Init ContainerはPodの `containers` で指定したコンテナが起動する前に初期化処理を目的として起動することができる。

以下のような特徴がある。

- Podのコンテナが起動する前に実行される
- 複数のInit Containerが指定されている場合、順に実行される
- Podの `restartPolicy` が `Always` の場合、Init Containerでは `OnFailure` が使用される

Init Containerでアプリケーションのコンテナと分離して実行する利点は以下のようなものがある。

- セキュリティ的な理由からアプリケーションのコンテナとツール系を含むコンテナを分離
- アプリケーションのコンテナに含まれていないツールやコードを使用して初期化処理をしたい場合

Init Containerは再起動や再実行されることがありえるため、初期化処理を実装する際は冪等性を考慮しなければならないことを注意しよう。

## Init Containerを使ってみる

前回の [5日目のVolumeについての記事]({{< ref "/posts/2018/k8sdojo-05/index.md" >}}) でファイルを追記してそのファイルをtailするPodを作成した。

しかしそのPodだが、並行して実行されること考えるとtailコンテナが先に実行する可能性だってある。
その場合ファイルが存在しないためtailコンテナは失敗してしまう。
(しかし、Kubernetesが失敗を検知して再起動してくれる。素晴らしい！)

さて、このPodの初期化処理としてInit Containerでファイルを作成しよう。以下のようなManifestファイルを作成した。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: date-tail
spec:
  initContainers:
  - name: touch
    image: alpine
    command: ["sh", "-c"]
    args:
    - |
      echo Initialize... (Started at `date`)
      touch /var/log/date-tail/output.log
    volumeMounts:
    - name: log-volume
      mountPath: /var/log/date-tail
  containers:
  - name: date
    image: alpine
    command: ["sh", "-c"]
    args:
    - |
      echo Append log... (Started at `date`)
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
      echo Following... (Started at `date`)
      tail -f /var/log/date-tail/output.log
    volumeMounts:
    - name: log-volume
      mountPath: /var/log/date-tail
  volumes:
  - name: log-volume
    emptyDir:
  terminationGracePeriodSeconds: 0
```

ありがたみは少ない感じがあるが。Init Containerで対象の出力先のファイルを作成している。
(結果もそんなに変わらないので省略させてもらう。)

もう一つ、Init Contaierが順番に実行されるのを確認してみよう。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: initcontainer-test
spec:
  initContainers:
  - name: step1
    image: alpine
    command: ["sh", "-c"]
    args:
    - |
      echo Start at `date`; sleep 5; echo End. 
  - name: step2
    image: alpine
    command: ["sh", "-c"]
    args:
    - |
      echo Start at `date`; sleep 5; echo End. 
  - name: step3
    image: alpine
    command: ["sh", "-c"]
    args:
    - |
      echo Start at `date`; sleep 5; echo End. 
  containers:
  - name: app1
    image: alpine
    command: ["sh", "-c"]
    args:
    - |
      echo Start at `date`; sleep 5; echo End. 
  - name: app2
    image: alpine
    command: ["sh", "-c"]
    args:
    - |
      echo Start at `date`; sleep 5; echo End. 
  restartPolicy: Never
  terminationGracePeriodSeconds: 0
```

このPodを作成して各コンテナのログを確認してみよう。

また、作成してすぐに `kubectl get po -w` を実行すると、どの様に実行されてるかわかりやすいと思う。

```plain
$ kubectl apply -f initcontainer-test.yaml && kubectl get po -w
pod/initcontainer-test created
NAME                 READY     STATUS     RESTARTS   AGE
initcontainer-test   0/2       Init:0/3   0          0s
initcontainer-test   0/2       Init:0/3   0         3s
initcontainer-test   0/2       Init:1/3   0         8s
initcontainer-test   0/2       Init:1/3   0         11s
initcontainer-test   0/2       Init:2/3   0         16s
initcontainer-test   0/2       Init:2/3   0         18s
initcontainer-test   0/2       PodInitializing   0         23s
initcontainer-test   2/2       Running   0         26s
initcontainer-test   1/2       Running   0         30s
initcontainer-test   0/2       Completed   0         31s
^C
$ kubectl logs initcontainer-test -c step1
Start at Wed Dec 5 16:43:50 UTC 2018
End at Wed Dec 5 16:43:55 UTC 2018.
$ kubectl logs initcontainer-test -c step2
Start at Wed Dec 5 16:43:57 UTC 2018
End at Wed Dec 5 16:44:02 UTC 2018.
$ kubectl logs initcontainer-test -c step3
Start at Wed Dec 5 16:44:04 UTC 2018
End at Wed Dec 5 16:44:09 UTC 2018.
$ kubectl logs initcontainer-test -c app1
Start at Wed Dec 5 16:44:11 UTC 2018
End at Wed Dec 5 16:44:16 UTC 2018.
$ kubectl logs initcontainer-test -c app2
Start at Wed Dec 5 16:44:12 UTC 2018
End at Wed Dec 5 16:44:17 UTC 2018.
```

上記のようにInit Containerの処理では `initContainers` で指定した順番で処理が実行されていることが分かる。
Init Containerでは1つずつコンテナが実行されており、完了してから次のコンテナが起動し処理をしている。

また、アプリケーションのコンテナでは並行して処理されていることも確認できる。

Init Containerについては一旦ここまで。

# Lifecycleについて

今度はPodのLifecycleについて。

Podにはいくつかの `phase` がある。

- `Pending` : Kubernetesによって承認されたが、一つ以上のコンテナが作成されていない状態。ImageのPullやInit Containerの処理中がこの状態にあたる
- `Running` : コンテナが作成され、少なくとも1つのコンテナが実行されているか開始・再起動中の状態
- `Succeeded`: Pod内の全てのコンテナが正常に終了し、再起動されていない状態
- `Failed` : Pod内の全てのコンテナが終了し、少なくとも1つ以上のコンテナの終了ステータスが0以外だったか、Kubernetesによって強制終了させられた場合この状態になる
- `Unknown` : 何らかの理由によりPodのサーバーと通信が失敗し、Podの状態を取得できなかった際の状態

## Lifecycle Events

また、コンテナが開始された際とPodが削除される際にHookして任意の処理を実行することが出来る。

- `postStart` : コンテナが作成された後、即座に実行される。このHandlerが失敗した場合終了させ、 `restartPolicy` に従い再起動させる
- `preStop` : コンテナが終了される前に実行される。コンテナのルートプロセスに対して `SIGTERM` が送出される前にこのHandlerが実行される。

大まかなPod起動までの流れとLifecycle Eventのタイミングは以下の通り。
(ちょっと雑すぎる気もするけど :sweat_smile:)


{{< img name="pod-lifecycle" >}}


終了処理の部分の `preStop` についてもう少し。

`preStop` が定義されている場合それを実行する。
ここでコンテナの終了処理を行うが、 `preStop` が先に終了してしまうとコンテナ側が処理中だとしてもKubernetesはコンテナに対してSIGTERMを送信してしまう。
これを防ぎたい場合は、 `preStop` 側でSleepさせるなどの待機処理を入れて待たせる必要がある。

また、 `terminationGracePeriodSeconds` や kubectlで指定されたGracePeriodの指定時間を超えても `preStop` が終了しない場合は、
GracePeriodを少し伸ばし(2秒)、コンテナのプロセスSIGTERMを送信する。

このPodの終了処理の部分については以下の記事が非常に詳しく解説されているので是非参考に。

[Kubernetes: 詳解 Pods の終了 - Qiita](https://qiita.com/superbrothers/items/3ac78daba3560ea406b2)

## Lifecycle Handler

`postStart` や `preStop` に指定できるHandlerの種類は以下の通り。

- `exec` : コンテナ内でコマンドを実行
- `httpGet` : HTTPのGETリクエストを発行

`exec` を指定し、異常終了した際には `kubectl describe` コマンドにてHandlerのログが確認できる。正常終了時には確認できないため要注意。

以下に `lifecycle` を使ったManifestを置いておく。 `exit` コマンドの数値を変えてログの確認や挙動の確認など試してみると良いと思う。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: lifecycle-check
spec:
  initContainers:
  - name: init
    image: alpine
    command: ["sh", "-c"]
    args:
    - |
      echo Start at `date`; sleep 3; echo End at `date`. ; exit 0
  containers:
  - name: app
    image: alpine
    command: ["sh", "-c"]
    args:
    - |
      trap 'echo "Trapped SIGTERM"; sleep 3; echo "See you!!"; exit 0' TERM

      echo Start.

      while true
      do
          date
          sleep 1
      done
    lifecycle:
      postStart:
        exec:
          command:
            - sh
            - -c
            - |
              echo hook postStart.
              date
              exit 0
      preStop:
        exec:
          command:
            - sh
            - -c
            - |
              echo hook preStop.
              date
              exit 0
  restartPolicy: Never
  terminationGracePeriodSeconds: 30
```


--------------------------------------------------


というわけで今回はここまで。

次回は Resource Requirements と Security Context について見ていこう。

それでは。

