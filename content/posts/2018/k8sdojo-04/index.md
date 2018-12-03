---
title: Kubernetes道場 4日目 - Container Objectのフィールドについて

date: 2018-12-04T00:00:00+09:00

tags:
- kubernetes
- advent-calendar-2018
- kubernetes-dojo

resources:
- name: thumbnail
  src: header.jpg

---

この記事は [Kubernetes道場 Advent Calendar 2018](https://qiita.com/advent-calendar/2018/k8s-dojo) 4日目の記事です。

今回はPodの `containers` フィールドで指定されるContainer Objectについて簡単に解説する。

# Container Objectのフィールドについて

Container Objectについては重要なフィールドがいくつかある。

- envFrom
- lifecycle
- livenessProve
- readinessProve
- resources
- securityContext
- volumeMounts

これらのフィールドについては結構重要なものなので後日別の記事で解説しようと思う。
なのでそれ以外のよく用いるフィールドを解説しようと思う。

## command

Entrypointの配列を指定。要はコンテナで起動させたいプロセスを指定する。

このフィールドを省略すると、Dockerイメージの `ENTRYPOINT` が使用される。
また、 `$VAR_NAME` のような変数の参照はコンテナの環境変数を使い展開される。

このフィールドは更新不可である。

e.g.

```yaml
command: ["sh", "-c"]
```

## args

引数の配列を指定。

このフィールドを省略すると、Dockerイメージの `CMD` が使用される。
また、commandフィールドと同様に変数の参照はコンテナの環境変数を使い展開される。

このフィールドは更新不可である。

e.g.

```yaml
args: |
  echo hello world from $HOSTNAME
  date
  sleep 3
```

## env

コンテナ内の環境変数を指定する。

このフィールドは更新不可である。

e.g.

```yaml
env:
  HOGEHOGE: fugafuga
  FOO: bar
```

## image

コンテナイメージ名を指定する。

e.g.

```yaml
image: nginx:alpine
```

## imagePullPolicy

コンテナイメージをPullするポリシーを指定する。以下の3つから選択する。

- Always: 常にコンテナイメージをPullする
- IfNotPresent: 既にコンテナイメージがあればPullを実行しない
- Never: Pullを実行しない。ローカルにコンテナイメージがあることを期待する

また、このパラメータを省略した際には `image` の値を元に挙動が変わる。

- コンテナイメージのタグが `latest` だった場合、 `Always` が適用される
- コンテナイメージのタグが `latest` ではないが指定されている場合、 `IfNotPresent` が適用される

e.g.

```yaml
imagePullPolicy: Always
```

このフィールドは更新不可である。

## name

コンテナ名を指定する。フォーマットは [DNS_LABEL](https://tools.ietf.org/html/rfc1035#page-8) に従っていること。

```plain
<label> ::= <letter> [ [ <ldh-str>  ] <let-dig>  ]
```

要は、アルファベットで始まり、アルファベットか数字かハイフンが続き、アルファベットか数字で終わる文字列。

また、 Pod内でそれぞれのコンテナはユニークである必要がある。

このフィールドは更新不可である。

e.g.

```yaml
name: nginx-pod
```

## ports

コンテナからexposeするポートを指定。

このフィールドは更新不可である。

- `containerPort` : PodのIPからExposeするポート番号を指定
- `name` : Named Portとして利用する際の名前を指定。Pod内でユニークである必要がある
- `protocol` : ポートのプロトコルを指定。 `TCP` / `UDP` / `SCTP` から指定する。デフォルトは `TCP` 

その他のフィールドについては以下を参照。

[ContainerPort v1 core - Kubernetes API Reference Docs v1.12](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.12/#containerport-v1-core)

e.g.

```yaml
ports:
- name: http
  containerPort: 8080
```

## workingDir

コンテナのワーキングディレクトリを指定する。

省略された場合、Container Runtimeのデフォルトが使用される。コンテナイメージで指定されている際、それが使用される可能性がある。

e.g.

```yaml
workingDir: /tmp
```


# 使用例と確認

前回nginxイメージを指定したPodを作成したが、このPodについて今回説明したフィールドを明示的に指定してみる。

ちょっと訳有で、コンテナイメージは `nginx:alpine` を使用する。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
  - name: nginx
    image: nginx:alpine
    imagePullPolicy: Always
    command: []
    args: ["nginx", "-g", "daemon off;"]
    env:
    - name: HOGEHOGE
      value: fugafuga
    ports:
    - containerPort: 80
      protocol: TCP
    workingDir: /tmp
```

基本的には上での解説どおりだが、 `command` と `args` 、 `env` 、 `workingDir` の確認をしておこう。

上のyamlをnginx.yamlというファイルで保存し、Podを作成する。


```sh
$ kubectl apply -f nginx.yaml
pod/nginx created
$ kubectl get all
NAME        READY     STATUS    RESTARTS   AGE
pod/nginx   1/1       Running   0          3s
```

`kubectl exec` コマンドで指定のPodの中のコンテナ内にプロセスを起動させることが出来る。このコマンドを使って起動しているプロセスを確認してみよう。

(この時psコマンドを使うのだが、 `nginx` イメージには入っていないため `nginx:alpine` イメージを使うようにした)

```sh
$ kubectl exec nginx ps
PID   USER     TIME  COMMAND
1 root      0:00 nginx: master process nginx -g daemon off;
8 nginx     0:00 nginx: worker process
93 root      0:00 ps
```

この様にPIDが1でnginxプロセスが `nginx -g daemon off` で実行されていることが分かる。

次に環境変数を見てみよう。

```sh
$ kubectl exec nginx env
kubectl exec nginx env
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
HOSTNAME=nginx
HOGEHOGE=fugafuga
KUBERNETES_SERVICE_PORT=443
KUBERNETES_SERVICE_PORT_HTTPS=443
KUBERNETES_PORT=tcp://10.43.240.1:443
KUBERNETES_PORT_443_TCP=tcp://10.43.240.1:443
KUBERNETES_PORT_443_TCP_PROTO=tcp
KUBERNETES_PORT_443_TCP_PORT=443
KUBERNETES_PORT_443_TCP_ADDR=10.43.240.1
KUBERNETES_SERVICE_HOST=10.43.240.1
NGINX_VERSION=1.15.7
HOME=/root
```

`HOGEHOGE=fugafuga` がありますね、ちゃんと反映されている。

さて、最後にワーキングディレクトリを確認しておこう。プロセスのワーキングディレクトリの確認は `/proc/[PID]/cwd` のシンボリック先を確認することで可能だ。

PIDは1なので `/proc/1/cwd` のリンク先を確認する。

```sh
$ kubectl exec nginx readlink /proc/1/cwd
/tmp
```

指定した通り、 `/tmp` になっている。


--------------------------------------------------


というわけで今回はここまで。

次回はContainer Objectで指定できる `livenessProve` と `readinessProve` について見ていこう。

それでは。

