---
title: GKEでCloud Storageをマウントしてみる

date: 2016-12-03T23:03:12+09:00
draft: false

tags:
- gke
- kubernetes
- gcs
- gcsfuse
- docker

resources:
- name: thumbnail
  src: header.png
- name: rps
  src: req_per_sec.png
- name: tpr
  src: time_per_req.png

---

この記事は [CyberAgent Developers Advent Calendar 2016](http://www.adventar.org/calendars/1620) の3日目の記事となります。

では早速本題に。

# やろうと思ったわけ

思い立ったからです。

とか言う冗談はいいとして。

Cloud Storage上に対象のファイルが存在した場合、そのファイルを返す。という仕組みを作ろうと思いました。

真っ先に思いつくのはアプリでファイルの存在確認後、存在したらそれを返すというものでした。

が、少し違うアプローチで、FUSE(Filesystem in Userspace)のGCS対応しているgcsfuseを使用してコンテナに
マウントしてnginxで返す、という構成をやってみようということになりました。

この仕組みでいけば

- アプリの実装がいらない
- アプリが死んでてもレスポンスが返せる

という感じで利点が見え、検証してみることに。

# コンテナの作成

フロントに置くnginx兼gcsfuseでフォルダにマウントするコンテナを作ります。

## Dockerfile書く。

以下が作成したDockerfile。

```Dockerfile
FROM alpine:3.4

ENV BUILD_DEPS \
    go \
    git \
    tar \
    wget \
    build-base \
    fuse-dev \
    curl-dev

ENV RUN_DEPS \
    fuse \
    curl \
    nginx

ENV GOPATH /tmp/go
ENV GO15VENDOREXPERIMENT 1

RUN set -xe && \
    apk add --no-cache $BUILD_DEPS $RUN_DEPS && \
    go get -u github.com/googlecloudplatform/gcsfuse && \
    mv $GOPATH/bin/gcsfuse /usr/local/bin && \
    apk del $BUILD_DEPS && \
    mkdir -p /run/nginx && \
    rm -rf /tmp/*

COPY docker-entrypoint.sh /usr/local/bin

EXPOSE 80
ENTRYPOINT ["docker-entrypoint.sh"]
```

ベースにAlpine Linux使っています。
簡単には

1. 動作に必要なライブラリとnginxのインストール
1. gcsfuseのビルド
1. コマンドだけパスが通っているところに移動
1. 不要なファイル・パッケージの削除
1. entrypointとなるシェルのコピー

という感じです。

## entrypoint用のシェル

コンテナ起動時に実行されるシェルの内容です。

```shell
#!/bin/sh

# env check
if [ -z $GCS_BUCKET_NAME ]; then
    echo "Empty GCS_BUCKET_NAME..." >&2
    exit 1
fi

# make mount point
mkdir -p /mnt/gcs/$GCS_BUCKET_NAME

# mount gcs
gcsfuse -o allow_other $GCS_BUCKET_NAME /mnt/gcs/$GCS_BUCKET_NAME

# create symlink
if [ -L /var/lib/nginx/html ]; then
    rmdir /var/lib/nginx/html
else
    rm -rf /var/lib/nginx/html
fi
ln -sfn /mnt/gcs/$GCS_BUCKET_NAME /var/lib/nginx/html

# main process
nginx -g "daemon off;"

# unmount
fusermount -u /mnt/gcs/$GCS_BUCKET_NAME
```

このシェルでは

1. マウントポイントの作成&マウント
1. nginxがrootとするパスにシンボリックリンクを作成
1. nginxをフォアグラウンドで起動
1. 終了時にアンマウント

という感じです。

## でてきた問題点

ローカルでBuildしてテストしていたところ、問題点が出てきました。

Cloud Storageをマウントする際にgcsfuseがOperation not permittedといってマウントしてくれません。
Dockerはデフォルトでコンテナがあらゆるデバイスに対してのアクセスを許可していないためでした。

このため、このコンテナを起動する際には

- --privilegedオプションを使用して起動
- --cap-addで適切な権限のみを付与して起動

をする必要があるようです。
今回は--privilegedオプションを渡して起動してみます。
(--cap-addについては記事書いてる最中に知った・・)

# Kubernetesの設定ファイルの作成

## Secret

GCPでサービスアカウントを作成し、その秘密鍵のJSONファイルをSecretを使ってKubernetesに渡します。

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: gcs-secret
type: Opaque
stringData:
  credential: |-
    {{ JSONの秘密鍵 }}
```

## ReplicaSet

ReplicaSetの設定ファイルを作ります。

```yaml
apiVersion: extensions/v1beta1
kind: ReplicaSet
metadata:
  name: frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      tier: frontend
    matchExpressions:
      - { key: tier, operator: In, values: [frontend] }
  template:
    metadata:
      labels:
        app: gcsfuse
        tier: frontend
    spec:
      containers:
        - name: gcsfuse
          image: gcr.io/sandbox/gcstest/gcsfuse
          resources:
            requests:
              cpu: 100m
              memory: 100Mi
          env:
            - name: GCS_BUCKET_NAME
              value: gcsfuse-test-bucket
            - name: GOOGLE_APPLICATION_CREDENTIALS
              value: /etc/gcs/credential
          ports:
            - containerPort: 80
          securityContext:
            privileged: true
          volumeMounts:
            - name: cred
              mountPath: /etc/gcs
      volumes:
        - name: cred
          secret:
            secretName: gcs-secret
            defaultMode: 256
```

このReplicaSetは次世代のReplication Controllerだそうです。
といっても違いはselectorのサポートで、matchExpressionsが使えるようになったことぐらいみたいです。

要点としてはsecretでKubernetesに渡している情報を`/etc/gcs`にマウントしています。
また、このコンテナのsecurityContentのprivilegedをtrueにしてマウント操作を許可するようにしています。

## Service

Serviceは普通です。

```yaml
kind: Service
apiVersion: v1
metadata: 
  name: frontend-service
spec: 
  selector: 
    app: gcsfuse
  ports: 
  - protocol: TCP
    port: 80
  type: LoadBalancer
```

GCPのLoadBalancer機能で先程作ったReplicaSetのPodにアクセスできるようにしています。


# 適当に検証

コンテナ、Kubernetesの設定ができたのでabコマンドで検証してみます。
Zoneはasia-northeast1-aです。

| クラスタ名　 | インスタンスタイプ　 | ディスクサイズ |
|:-------------|:---------------------|---------------:|
| Cluster1     | n1-standard-1        | 100GB          |
| Cluster2     | n1-standard-1        | 300GB          |
| Cluster3     | n1-standard-4        | 100GB          |
| Cluster4     | n1-standard-4        | 300GB          |

上記のクラスタにデプロイしてみて500リクエスト、並列数10でリクエストを送ってみて、
10Byteほどのテキストファイル(File1)と300KBほどの画像ファイル(File2)をレスポンスとして返してもらいます。

## Requests per second

{{< img name="rps" >}}

| クラスタ名　 | File1   | 　　File2  |
|:-------------|--------:|-----------:|
| Cluster1     | 12.985  | 59.364     |
| Cluster2     | 12.320  | 46.882     |
| Cluster3     | 8.962   | 45.347     |
| Cluster4     | 5.422   | 45.114     |


## Time per request

{{< img name="tpr" >}}

| クラスタ名 | File1   | File2  |
|:-----------|--------:|-------:|
| Cluster1   | 12.985  | 59.364 |
| Cluster2   | 12.320  | 46.882 |
| Cluster3   | 8.962   | 45.347 |
| Cluster4   | 5.422   | 45.114 |


## 所感

思ったよりも捌けている・・・。

ローカルで動作させていたときはlsするだけでも1秒とかかかっていて、Webのリクエストについても1,2秒ほど
かかっていたのですが、GKE上で動作させたら普通に許容できるくらいには捌いていますね。


# まとめ

本当にザッとですが、構築と簡単な検証をやってみました。
要点としては、

- mount操作するコンテナはprivilegedでの起動が必要
- そこそこ捌ける

という感じでした。
ただ、プロダクション環境に導入するか？という問があったとすると、privilegedで起動するコンテナがあったり、
そもそもgcsfuseはGoogleがメンテナンスを保証しておらず、ベータ版からGA版に移行するつもりがないようなので
選択肢としては無しな気がします。

ちょっと悲しい終わり方ですが、以上になります!!

明日の[CyberAgent Developers Advent Calendar 2016](http://www.adventar.org/calendars/1620)もお楽しみください！


## ちょっとだけ追記

privilegedで起動してしまうとコンテナでほとんどのことが出来てしまうようなので、
cap-addオプションとsecurity-optオプションを使って権限を絞りつつマウント操作を行えるようです。

```sh
docker run \
    --cap-add=SYS_ADMIN
    --security-opt apparmor:unconfined \
    alpine \
    ash -c "mkdir test;mount --bind /tmp /test"
```

一気にマウント処理までやっちゃってますが、エラーでなければ成功です。
selinuxなど使用している場合はsecurity-optオプションが必要です。

追記以上でした〜。


