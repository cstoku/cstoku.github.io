---
title: Kubernetes道場 11日目 - ConfigMap / Secretについて

date: 2018-12-11T00:00:00+09:00
draft: true

tags:
- kubernetes
- advent-calendar-2018
- kubernetes-dojo

resources:
- name: thumbnail
  src: header.jpg

---

この記事は [Kubernetes道場 Advent Calendar 2018](https://qiita.com/advent-calendar/2018/k8s-dojo) 11日目の記事です。

今回はConfigMapとSecretについて。

# ConfigMapとSecret

ConfigMapやSecretはアプリケーションの設定やクレデンシャルをコンテナイメージから分離するために使われる。

ConfigMapやSecretをVolumeとして、または環境変数を通してPodに設定やクレデンシャルを渡す。

まずは作成の仕方から見ていこう。

# ConfigMap / Secret の作成方法

主に2通りあり、 `kubectl create` コマンドを使った方法と、Manifestを使う方法がある。

## kubectl createで作成する

ConfigMapは `kubectl create configmap` またはリソース名の短縮形の `kubectl create cm` コマンドで作成する。

Secretは `kubectl create secret generic` コマンドで作成する。

これらのコマンドとオプションを利用して作成する。 また、オプションは複数回使用することができる。

### --from-file オプション

以下のようなファイルを作成した。

```plain
hogehoge
fugafuga
foo bar baz
```

`--from-file` オプションを使って作成し、作成されたConfigMapを確認してみよう。

```plain
$ kubectl create cm params --from-file=params.txt
configmap "params" created
$ kubectl get cm/params -o yaml
apiVersion: v1
data:
  params.txt: |
    hogehoge
    fugafuga
    foo bar baz
kind: ConfigMap
metadata:
  creationTimestamp: 2018-12-10T16:34:55Z
  name: params
  namespace: default
  resourceVersion: "88989"
  selfLink: /api/v1/namespaces/default/configmaps/params
  uid: 86fedc49-fc99-11e8-a8f4-080027f4eb79
```

ファイル名がKeyとして、ファイルの内容がValueとして保存される。この際、ファイル名を変更したい場合は `--from-file` オプションでKeyを同時に指定する。

```plain
$ kubectl create cm params --from-file=paramfile=params.txt
configmap "params" created
$ kubectl get cm/params -o yaml
apiVersion: v1
data:
  paramfile: |
    hogehoge
    fugafuga
    foo bar baz
kind: ConfigMap
metadata:
  creationTimestamp: 2018-12-10T16:37:59Z
  name: params
  namespace: default
  resourceVersion: "89210"
  selfLink: /api/v1/namespaces/default/configmaps/params
  uid: f41d1074-fc99-11e8-a8f4-080027f4eb79
```

Secretの作成方法も同様だ。しかし、作成されたあとのManifestファイルが少々違う。

以下のようなファイルを元にSecretを作成する。

```plain
database_password
```

オプションなどの使用方法は同様だ。

```plain
$ kubectl create secret generic dbpass --from-file=pass.txt
secret "dbpass" created
$ kubectl get secret/dbpass -o yaml
apiVersion: v1
data:
  pass.txt: ZGF0YWJhc2VfcGFzc3dvcmQK
kind: Secret
metadata:
  creationTimestamp: 2018-12-10T16:41:10Z
  name: dbpass
  namespace: default
  resourceVersion: "89442"
  selfLink: /api/v1/namespaces/default/secrets/dbpass
  uid: 66493e4e-fc9a-11e8-a8f4-080027f4eb79
type: Opaque
```

Keyはファイル名となっておりConfigMapと同じだ。しかしValueはBase64でエンコードされている。デコードすると確認できる。

```plain
$ echo 'ZGF0YWJhc2VfcGFzc3dvcmQK' | base64 -d
database_password
```

このエンコードはSecretのManifest内だけで、PodにVolumeや環境変数として展開した際にはデコードされた状態で展開されるので、利用時には特に意識する必要はない。

### --from-env-file オプション

`--from-env-file` オプションは行ごとに `=` で区切られたKeyとValueの組み合わせで記述されたファイル。

以下のような書式のファイルだ。

```plain
hoge=fuga
foo=bar
```

さて、このファイルと `--from-env-file` オプションを使ってConfigMapを作ってみよう。

```plain
$ kubectl create cm envs --from-env-file=envs.properties
configmap "envs" created
$ kubectl get cm/envs -o yaml
apiVersion: v1
data:
  foo: bar
  hoge: fuga
kind: ConfigMap
metadata:
  creationTimestamp: 2018-12-10T16:51:49Z
  name: envs
  namespace: default
  resourceVersion: "90208"
  selfLink: /api/v1/namespaces/default/configmaps/envs
  uid: e2eeba28-fc9b-11e8-a8f4-080027f4eb79
```

上記のように、 `=` 区切りのKey/Valueで指定してたものがそのままConfigMapに反映されている。

Secretも同様の方法で作成できるので省略する。

### --from-literal オプション

`--from-literal` オプションはCLIでそのままパラメータを指定する。

実際に作成してみる。

```plain
$ kubectl create cm from-literal --from-literal=key1=value1 --from-literal=key2=value2
configmap "from-literal" created
$ kubectl get cm/from-literal -o yaml
apiVersion: v1
data:
  key1: value1
  key2: value2
kind: ConfigMap
metadata:
  creationTimestamp: 2018-12-10T16:57:15Z
  name: from-literal
  namespace: default
  resourceVersion: "90602"
  selfLink: /api/v1/namespaces/default/configmaps/from-literal
  uid: a54454c2-fc9c-11e8-a8f4-080027f4eb79
```

オプションで指定した通りに作成されていることがわかる。

こちらもSecretについては同様の方法で作成できるので省略する。


## Manifestを使用した作成方法

次にManifestを使用した作成方法だ。

こちらについてはConfigMapとSecretで作成方法が少々違う。

### Manifestを使用したConfigMapの作成方法

CLIで作成されたConfigMapを見れば少しわかるかも知れないが、`data` フィールドの中にパラメータをKey/Valueの形で指定する。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: test-cm
data:
  HOGEHOGE: FUGAFUGA
  config.txt: |
    hogehoge
    fugafuga
    foo bar baz
```

上記のManifestを適用してみよう。

```plain
$ kubectl apply -f test-cm.yaml
configmap "test-cm" created
$ kubectl get cm/test-cm -o yaml
apiVersion: v1
data:
  HOGEHOGE: FUGAFUGA
  config.txt: |
    hogehoge
    fugafuga
    foo bar baz
kind: ConfigMap
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"v1","data":{"HOGEHOGE":"FUGAFUGA","config.txt":"hogehoge\nfugafuga\nfoo bar baz\n"},"kind":"ConfigMap","metadata":{"annotations":{},"name":"test-cm","namespace":"default"}}
  creationTimestamp: 2018-12-10T17:07:19Z
  name: test-cm
  namespace: default
  resourceVersion: "91326"
  selfLink: /api/v1/namespaces/default/configmaps/test-cm
  uid: 0d2a7668-fc9e-11e8-a8f4-080027f4eb79
```

このようにConfigMapが作成できる。

また、UTF-8に含まれないバイトシーケンスがある場合、binaryDataというフィールドが使える。このフィールドはValueをbase64でエンコードする必要がある。

作成してみよう。 `/dev/urandom` から20バイト分読み出してbase64でエンコードする。

```plain
head -c 20 /dev/urandom | base64
033KcFyEuuprx7sKlwrP5IJJYgA=
```

 この文字列を元にConfigMapのManifestを作成する。

 ```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: bin-cm
binaryData:
  raw-urandom: 033KcFyEuuprx7sKlwrP5IJJYgA=
 ```

さて、上記のManifestを適用して確認してみよう。

```plain
$ kubectl apply -f bin-cm.yaml
configmap "bin-cm" created
$ kubectl get cm/bin-cm -o yaml
apiVersion: v1
binaryData:
  raw-urandom: 033KcFyEuuprx7sKlwrP5IJJYgA=
kind: ConfigMap
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"v1","binaryData":{"raw-urandom":"033KcFyEuuprx7sKlwrP5IJJYgA="},"kind":"ConfigMap","metadata":{"annotations":{},"name":"bin-cm","namespace":"default"}}
  creationTimestamp: 2018-12-10T17:17:03Z
  name: bin-cm
  namespace: default
  resourceVersion: "92028"
  selfLink: /api/v1/namespaces/default/configmaps/bin-cm
  uid: 69c94176-fc9f-11e8-a8f4-080027f4eb79
```

作成できた。


### Manifestを使用したSecretの作成方法

SecretはConfigMapのManifestとかなり似ているが、dataのValueをbase64でエンコードする必要がある。

passwordとして `1mbb1G968fb1CUg` を格納するように作成してみよう。まず上記の文字列をbase64でエンコードする。

```plain
echo -n '1mbb1G968fb1CUg' | base64
MW1iYjFHOTY4ZmIxQ1Vn
```

base64でエンコードされた文字列を元に以下のようなManifestを作成した。

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: test-secret
data:
  password: MW1iYjFHOTY4ZmIxQ1Vn
```

上記のManifestを適用して確認してみる。

```plain
$ kubectl apply -f test-secret.yaml
secret "test-secret" created
$ kubectl get secret/test-secret -o yaml
apiVersion: v1
data:
  password: MW1iYjFHOTY4ZmIxQ1Vn
kind: Secret
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"v1","data":{"password":"MW1iYjFHOTY4ZmIxQ1Vn"},"kind":"Secret","metadata":{"annotations":{},"name":"test-secret","namespace":"default"}}
  creationTimestamp: 2018-12-10T17:29:11Z
  name: test-secret
  namespace: default
  resourceVersion: "92902"
  selfLink: /api/v1/namespaces/default/secrets/test-secret
  uid: 1b22fed6-fca1-11e8-a8f4-080027f4eb79
type: Opaque
```

作成できていることがわかる。

実は `stringData` というフィールドがあり、こっちのフィールドを使用するとbase64にエンコードする必要がない。

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: test-string-secret
stringData:
  password: 1mbb1G968fb1CUg
```

作成してみよう。

```plain
$ kubectl apply -f test-string-secret.yaml
secret "test-string-secret" created
$ kubectl get secret/test-string-secret -o yaml
apiVersion: v1
data:
  password: MW1iYjFHOTY4ZmIxQ1Vn
kind: Secret
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"v1","kind":"Secret","metadata":{"annotations":{},"name":"test-string-secret","namespace":"default"},"stringData":{"password":"1mbb1G968fb1CUg"}}
  creationTimestamp: 2018-12-10T17:33:11Z
  name: test-string-secret
  namespace: default
  resourceVersion: "93192"
  selfLink: /api/v1/namespaces/default/secrets/test-string-secret
  uid: aa8efad7-fca1-11e8-a8f4-080027f4eb79
type: Opaque
```

このように `stringData` に指定されているデータをエンコードしてdataに格納して保存してくれる。

# ConfigMap / Secret の利用方法

さて、次はConfigMapとSecretをPodでどのように利用できるかを見ていこう。

最初にも書いたが、2通りの方法がある。

- Volume
- 環境変数

以下のConfigMapとSecretを使って利用方法を見ていこう。

```yaml
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: cm-data
data:
  HOGEHOGE: FUGAFUGA
  temp.txt: |
    hogehoge
    fugafuga
    foo bar baz
---
apiVersion: v1
kind: Secret
metadata:
  name: secret-data
stringData:
  password: 1mbb1G968fb1CUg
  credential.txt: |
    credential data
    sWIEpx9wUdrVizVq
    UxuZ8kTeXvzyOWLQ
    7QVJIN1OI5FhxT9e
```

先に作成しておこう。

```plain
$ kubectl apply -f cm-secret-data.yaml
configmap "cm-data" created
secret "secret-data" created
```

## Volumeを使う方法

以前やったPodのVolumeを指定する方法にConfigMapとSecretをマウントする方法がある。

`configMap` と `secret` フィールドに指定をしていく。

- `name` / `secretName` : ConfigMapやSecretのリソース名を指定する。
- `optional` : 対象のリソースを必須にするかを選択できる。Trueの場合、対象のリソースがなくてもPodは起動する。
- `defaultMode` : デフォルトの作成されるファイルのモードを指定する。デフォルトは0644だ。
- `items` : 通常Keyをファイル名、Valueをファイルの内容となるが、ファイルパスを指定する場合に指定する。
  - `key` : リソースの `data` にあるKeyを指定する。
  - `path` : マウントするパスを指定。 `..` を含むことができない(上の階層にマウントすることはできない)。
  - `mode` : ファイルのModeを指定する。

以下が例だ。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: volume-test
spec:
  containers:
  - image: alpine
    name: alpine
    command: ["tail", "-f", "/dev/null"]
    volumeMounts:
    - name: cm-volume
      mountPath: /config
    - name: secret-volume
      mountPath: /etc/secrets
    - name: secret-volume2
      mountPath: /secrets
  volumes:
  - name: cm-volume
    configMap:
      name: cm-data
  - name: secret-volume
    secret:
      secretName: secret-data
      defaultMode: 0600
      items:
      - key: credential.txt
        path: creds/secret.txt
        mode: 0400
  - name: secret-volume2
    secret:
      secretName: secret-data
  terminationGracePeriodSeconds: 0
```

上記のManifestを適用して、マウントされているのを確認しよう。

```plain
$ kubectl apply -f volume-test.yaml
pod "volume-test" created
$ kubectl exec volume-test -- ls /config
HOGEHOGE
temp.txt
$ kubectl exec volume-test -- cat /config/temp.txt
hogehoge
fugafuga
foo bar baz
$ kubectl exec volume-test -- cat /config/HOGEHOGE
FUGAFUGA
$ kubectl exec volume-test -- ls -l /etc/secrets
total 0
lrwxrwxrwx    1 root     root            12 Dec 10 18:21 creds -> ..data/creds
$ kubectl exec volume-test -- ls -l /etc/secrets/creds/
total 4
-r--------    1 root     root            67 Dec 10 18:21 secret.txt
$ kubectl exec volume-test -- cat /etc/secrets/creds/secret.txt
credential data
sWIEpx9wUdrVizVq
UxuZ8kTeXvzyOWLQ
7QVJIN1OI5FhxT9e
$ kubectl exec volume-test -- ls -l /secrets
total 0
lrwxrwxrwx    1 root     root            21 Dec 10 18:27 credential.txt -> ..data/credential.txt
lrwxrwxrwx    1 root     root            15 Dec 10 18:27 password -> ..data/password
$ kubectl exec volume-test -- cat /secrets/password
1mbb1G968fb1CUg
$ kubectl exec volume-test -- cat /secrets/credential.txt
credential data
sWIEpx9wUdrVizVq
UxuZ8kTeXvzyOWLQ
7QVJIN1OI5FhxT9e
```

こんな形でマウントできるのがわかる。ただし、 `items` で指定した場合は指定したデータだけがマウントされる対象になる。

## 環境変数を使う方法

ConfigMapとSecretを環境変数から使用する場合は `env` の `valueFrom` と `envFrom` を使用する方法がある。

### env.valueFromの指定方法

ConfigMapの場合は `configMapKeyRef` 、Secretの場合は `secretKeyRef` に以下のフィールドを指定する。

- `name` : ConfigMapやSecretのリソース名を指定する。
- `key` : `data` にあるKeyを指定する。
- `optional` : 対象のリソースを必須にするかを選択できる。Trueの場合、対象のリソースがなくてもPodは起動する。

以下が例だ。

```yaml
env:
- name: HOGE
  valueFrom:
    configMapKeyRef:
      name: cm-data
      key: HOGEHOGE
- name: PASS
  valueFrom:
    secretKeyRef:
      name: secret-data
      key: password
      optional: true
```

### envFromの指定方法

`envFrom` には以下のフィールドを指定する。

- `prefix` : 環境変数名のPrefixを追加したい場合に指定することができる。
- `configMapRef` / `secretMapRef` : 以下のフィールドでリソースを選択する。
  - `name` : ConfigMapやSecretのリソース名を指定する。
  - `optional` : 対象のリソースを必須にするかを選択できる。Trueの場合、対象のリソースがなくてもPodは起動する。

以下が例だ。

```yaml
envFrom:
- configMapRef:
    name: cm-data
- prefix: SEC_
  secretRef:
    name: secret-data
```

##  環境変数を使った例

ConfigMapとSecretの情報を環境変数に展開する例だ。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: env-test
spec:
  containers:
  - image: alpine
    name: alpine
    command: ["tail", "-f", "/dev/null"]
    env:
    - name: HOGE
      valueFrom:
        configMapKeyRef:
          name: cm-data
          key: HOGEHOGE
    - name: PASS
      valueFrom:
        secretKeyRef:
          name: secret-data
          key: password
          optional: true
    envFrom:
    - configMapRef:
        name: cm-data
    - prefix: SEC_
      secretRef:
        name: secret-data
  terminationGracePeriodSeconds: 0
```

上記のManifestを適用して環境変数を確認してみよう。

```plain
$ kubectl apply -f env-test.yaml
pod "env-test" created
$ kubectl exec env-test -- env
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
HOSTNAME=env-test
SEC_credential.txt=credential data
sWIEpx9wUdrVizVq
UxuZ8kTeXvzyOWLQ
7QVJIN1OI5FhxT9e

SEC_password=1mbb1G968fb1CUg
HOGE=FUGAFUGA
PASS=1mbb1G968fb1CUg
HOGEHOGE=FUGAFUGA
temp.txt=hogehoge
fugafuga
foo bar baz

KUBERNETES_SERVICE_PORT=443
KUBERNETES_SERVICE_PORT_HTTPS=443
KUBERNETES_PORT=tcp://10.96.0.1:443
KUBERNETES_PORT_443_TCP=tcp://10.96.0.1:443
KUBERNETES_PORT_443_TCP_PROTO=tcp
KUBERNETES_PORT_443_TCP_PORT=443
KUBERNETES_PORT_443_TCP_ADDR=10.96.0.1
KUBERNETES_SERVICE_HOST=10.96.0.1
HOME=/root
```

`HOGEHOGE` にConfigMapのデータが反映されていたり、Prefixが追加されているのが確認できる。

このようにConfigMapとSecretを使ってPodに設定やクレデンシャルを展開することができる。

これを使ってアプリケーションのDBのパスワードやミドルウェアのコンフィグをファイルや環境変数で渡し、動作させることができる。

# ConfigMap と Secretの違い

ConfigMapとSecretは、Manifestなどでフィールド名に若干の違いがあるが、それ以外は特に変わったところが無いように見える。

Secretはクレデンシャルを扱うリソースのため、Node上でtmpfsに保存されマウントされる。これはNodeがクラッシュした際などにデータが消失される特性を使っている。

また、Secretには暗号化する機構が用意されている。適切にクラスタを設定するとSecretのデータを暗号化して保存してくれる仕組みが提供されいるわけだ。

# SecretのTypeについて

Secretのリソースをgetする際に、typeというフィールドに `Opaque` と指定されているのがあったと思う。

このSecretのTypeにはいくつか種類がある。

- `Opaque` : 構造化されてないKey/Value形式
- `kubernetes.io/tls` : TLSの秘密鍵と公開鍵を格納
- `kubernetes.io/service-account-token` : Kubernetesのサービスアカウントのクレデンシャル

KubernetesでSecretを扱う際には通常この `Opaque` を使用すれば問題ない。


--------------------------------------------------


というわけで今回はここまで。

次回はPersistentVolume / PersistentVolumeClaim / StorageClassについて見ていこう。

それでは。

