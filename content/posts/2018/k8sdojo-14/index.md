---
title: Kubernetes道場 14日目 - Job / CronJobについて

date: 2018-12-14T00:00:00+09:00

tags:
- kubernetes
- advent-calendar-2018
- kubernetes-dojo

resources:
- name: thumbnail
  src: header.jpg
- name: job-tl
  src: job-tl.jpg
- name: cronjob-policy-allow
  src: cronjob-policy-allow.jpg
- name: cronjob-policy-forbid
  src: cronjob-policy-forbid.jpg
- name: cronjob-policy-replace
  src: cronjob-policy-replace.jpg

---

この記事は [Kubernetes道場 Advent Calendar 2018](https://qiita.com/advent-calendar/2018/k8s-dojo) 14日目の記事です。

今回はJobとCronJobについて。

# Job

## Jobの概要

Jobは1つ以上のPodを作成し、指定された数が正常に終了するのを保証する。JobはPodが正常に完了したことを追跡する。

指定された数が正常に終了した際にJobが完了となる。

Jobを削除するとそのJobによって作成されたPodも削除される。

Jobを使用して複数のPodを並列に実行することも可能だ。

Jobの各要素について見ていこう。

### Jobの並列数と完了数

Jobには並列数と完了数が指定できる。並列数はデフォルトで1だ。完了数は指定されなかった場合は並列数と同じ値になる。

並列数指定すると、指定された数のPodが同時に起動され、実行される。

完了数を指定すると、指定された回数だけPodが正常に完了するまで実行される。

以下は並列数を3、完了数を5とした際の実行イメージ図だ。

{{< img name="job-tl" >}}

ついでに、並列数を完了数以上に大きくしても完了数と同じ数までしか並列に実行されない。

### Jobの失敗時の処理

コンテナが失敗した際、再起動のポリシーを選択できる。 `restartPolicy` に指定をする。このフィールドは以前Podの解説の際に扱った。

しかし、デフォルトで指定される `Always` はJobでは使用することが出来ない。指定できる値は以下の2つだ。

- `OnFailure` : 失敗時のみコンテナを再起動
- `Never` : コンテナを再起動しない

ここで、 `restartPolicy` に `Never` を指定していてPodがErrorになった際にはJobが新しいPodを作成して実行してくれる。

#### PodのBackoffの制限

Jobが失敗して再起動処理を無限に続けないように、 `backoffLimit` というフィールドで制限回数を設けることが出来る。デフォルトは6回となっている。

Podが失敗してbackoffする際に指数関数的に遅延を入れてから再度実行される。

### Jobの有効時間

Job自体の有効時間制限を設けることが出来る。 `activeDeadlineSeconds` に指定することが出来る。

この有効時間は `backoffLimit` で指定した値よりも優先して処理される。リトライ中でもこの時間を超えるとJobはErrorとして扱われる。

## Jobのフィールド

さて、Jobで指定できるフィールドについて見ていこう。

##### activeDeadlineSeconds

Jobの有効制限時間を秒数で指定する。Jobが開始した時からの相対的な時間で正数を指定する。

##### backoffLimit

失敗したJobのリトライ回数を指定する。デフォルトは6だ。

##### completions

正常終了する回数を指定する。詳細は[こちら](#jobの並列数と完了数)。

##### manualSelector

手動でSelectorを指定するかを指定する。デフォルトは `false` だ。

通常、PodのLabelとPodを選択するLabelSelectorはKubernetesによってユニークなラベルを自動的に生成・設定してくれる。

しかしこれをあえて手動で設定したい場合はこのフィールドを `true` にする。

##### parallelism

Jobで同時にPodを実行できる並列数を指定する。詳細は[こちら](#jobの並列数と完了数)。

##### selector

Podを選択するLabelSelectorを指定する。 `matchLabels` か `matchExpression` が使用できる。

通常このフィールドはKubernetesが自動的に設定してくれるため指定する必要はない。( `manualSelector` を参照)

##### template

Jobで実行するPodのTemplateを指定する。

Deploymentなどで指定するTemplateと同様のものなので詳しくはそちらを参考にしてほしい。

##### ttlSecondsAfterFinished

Jobが完了してからの生存時間を秒数で指定する。

この機能はv1.12時点ではAlphaの機能のためここでは省略させてもらう。

## Jobを使ってみる

それではJobを作成してみよう。

以下のManifestを作成した。

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: sleep
spec:
  completions: 5
  parallelism: 3
  template:
    spec:
      containers:
      - name: sleep
        image: alpine
        command: ["sh", "-c"]
        args:
        - |
          sleep 3
      restartPolicy: Never
```

上記の例の画像で出した並列数を3、完了数を5に設定した。

上記のManifestを適用する前に `kubectl get po -w` でPodの作成などの動きを確認できるようにしておこう。

それではManifestを適用してみよう。

```plain
$ kubectl apply -f job.yaml
job.batch/sleep created
```

さて、Podの動きの方を確認しよう。

```plain
$ kubectl get po -w
NAME          READY   STATUS    RESTARTS   AGE
sleep-qhvsf   0/1     Pending   0          0s
sleep-qjxnk   0/1   Pending   0     0s
sleep-qhvsf   0/1   Pending   0     0s
sleep-bdlhm   0/1   Pending   0     0s
sleep-qjxnk   0/1   Pending   0     0s
sleep-bdlhm   0/1   Pending   0     0s
sleep-qhvsf   0/1   ContainerCreating   0     0s
sleep-qjxnk   0/1   ContainerCreating   0     0s
sleep-bdlhm   0/1   ContainerCreating   0     0s
sleep-qjxnk   1/1   Running   0     4s
sleep-qjxnk   0/1   Completed   0     7s
sleep-ltjpm   0/1   Pending   0     0s
sleep-ltjpm   0/1   Pending   0     0s
sleep-bdlhm   1/1   Running   0     7s
sleep-ltjpm   0/1   ContainerCreating   0     0s
sleep-qhvsf   1/1   Running   0     10s
sleep-bdlhm   0/1   Completed   0     11s
sleep-jbwp5   0/1   Pending   0     0s
sleep-jbwp5   0/1   Pending   0     0s
sleep-jbwp5   0/1   ContainerCreating   0     0s
sleep-qhvsf   0/1   Completed   0     13s
sleep-ltjpm   1/1   Running   0     6s
sleep-jbwp5   1/1   Running   0     4s
sleep-ltjpm   0/1   Completed   0     9s
sleep-jbwp5   0/1   Completed   0     7s
```

少々見づらいが、同時に作成されているコンテナが3つまでなのが分かる。

また、 `Completed` になっているPodが完了数で指定した5個なのも確認できる。

Jobの取得は `job` で出来る。

```plain
kubectl get job
NAME    COMPLETIONS   DURATION   AGE
sleep   5/5           18s        5m54s
```

こちらでも完了した数が確認できる。

# CronJob

## CronJobの概要

CronJobは時間ベースのスケジュールでJobを作成するKubernetesオブジェクトだ。

CronJobは一つのオブジェクトでcrontabの1行の設定に対応している。記述はcrontabのフォーマットと同様だ。

CronJobの並行実行のポリシーについてだけ少し見ていこう。

### 並行実行のポリシー

CronJobで作成したJobの並行実行についてのポリシーを指定できる。ポリシーは3種類ある。

#### Allow

`Allow` は並行なJobの実行を許可するポリシーだ。

スケジュールされた時間に前回のJobがまだ実行されていてもJobが作成され実行される。

以下のようなイメージだ。

{{< img name="cronjob-policy-allow" >}}

#### Forbid

`Forbid` は前回のJobがまだ実行中で完了してない場合、スケジュールされたJobはスキップされる。

以下のようなイメージだ。

{{< img name="cronjob-policy-forbid" >}}

#### Replace

`Replace` は前回のJobがまだ実行中で完了してない場合、前回のJobをキャンセルし新しくスケジュールされるJobに置き換える。

以下のようなイメージだ。

{{< img name="cronjob-policy-replace" >}}

### Starting Deadline Seconds

この機能は何らかの理由でJobがスケジュールされなかった場合に、Jobをスケジュールする時間の許容する時間を指定する。

スケジュールされるはずの時間から、このパラメータで指定した秒数内にJobが作成されればエラーになる。

## CronJobのフィールドについて

さて、CronJobのフィールドについて見ていこう。

##### concurrencyPolicy

Jobの並行実行ポリシーを指定する。詳しくはこちらを参照。

下記の3つの中から指定する。

- `Allow`
- `Forbid`
- `Replace`

デフォルトは `Allow` だ。

##### successfulJobsHistoryLimit

正常終了したJobの履歴保有数を指定する。デフォルトは3だ。

##### failedJobsHistoryLimit

異常終了したJobの履歴保有数を指定する。デフォルトは1だ。

##### schedule

Cronのフォーマットでスケジュールの指定をする。

Cronのフォーマットについては[こちら](https://en.wikipedia.org/wiki/Cron)。

##### jobTemplate

CronJobがJobを作成する際のJobのテンプレートを指定する。

##### startingDeadlineSeconds

何らかの理由でJobがスケジュールされるのが遅れた際に許容できる時間を指定する。

詳しくは[こちら](#starting-deadline-seconds)。

##### suspend

`suspend` はCronJobのスケジューリングの対象とするかを指定する。

`true` にするとスケジュールの対象外とされる。デフォルトは `false` だ。

## CronJobを使ってみる

CronJobを作成してみよう。

以下のManifestを作成してみた。

```yaml
apiVersion: batch/v1beta1
kind: CronJob
metadata:
  name: test-cronjob
spec:
  schedule: "*/1 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: sleep
            image: alpine
            command: ["sh", "-c"]
            args:
            - |
              sleep 5
          restartPolicy: Never
```

1分毎にsleepを5秒実行するというなんとも意味の無いCronJobだ :sweat_smile:

上記のManifestを適用してみよう。

```plain
$ kubectl apply -f cronjob.yaml
cronjob.batch/test-cronjob created
```

CronJobを取得するには `cronjob` で取得できる。

```plain
$ kubectl get cronjob
NAME           SCHEDULE      SUSPEND   ACTIVE   LAST SCHEDULE   AGE
test-cronjob   */1 * * * *   False     1        4s              3m14s
```

さて、作成されているはずのJobとPodを確認してみよう。

```plain
$ kubectl get job,po
NAME                                COMPLETIONS   DURATION   AGE
job.batch/test-cronjob-1544927340   1/1           9s         2m42s
job.batch/test-cronjob-1544927400   1/1           9s         102s
job.batch/test-cronjob-1544927460   1/1           9s         42s

NAME                                READY   STATUS      RESTARTS   AGE
pod/test-cronjob-1544927340-bqxtw   0/1     Completed   0          2m42s
pod/test-cronjob-1544927400-m4r2f   0/1     Completed   0          102s
pod/test-cronjob-1544927460-zkz7q   0/1     Completed   0          42s
```

CronJobを元に作成されたJobが確認できる。また、AGEから1分毎に作成されていることも分かる。

この様にCronJobでJobを使った定期実行を行うことが出来る。


--------------------------------------------------


というわけで今回はここまで。

次回は Namespace / ResourceQuota / LimitRange / Resource QoS について見ていこう。

それでは。

