---
title: Kubernetes道場 16日目 - NetworkPolicyについて

date: 2018-12-16T00:00:00+09:00

tags:
- kubernetes
- advent-calendar-2018
- kubernetes-dojo

resources:
- name: thumbnail
  src: header.jpg

---

この記事は [Kubernetes道場 Advent Calendar 2018](https://qiita.com/advent-calendar/2018/k8s-dojo) 16日目の記事です。

今回はNetworkPolicyについて。

# NetworkPolicy

## NetworkPolicyの概要

NetworkPolicyはPodに対してPod間の通信や外部のエンドポイントへの通信を制御するためのリソースだ。

ラベルを利用してPodを選択し、選択されたPodのトラフィックのルールを定義していく。

今回はNetworkPolicyの要素を見ていくと同時にフィールドの説明を入れていく。

また、Manifestがあったほうが理解が進むかと思うので先にManifestの例を載せておこう。

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: test-np
spec:
  podSelector:
    matchLabels:
      role: app
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - ipBlock:
        cidr: 10.2.0.0/16
        except:
        - 10.2.1.0/24
    - namespaceSelector:
        matchLabels:
          project: test-app
    - podSelector:
        matchLabels:
          role: frontend
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - ipBlock:
        cidr: 172.31.0.0/16
    ports:
    - protocol: TCP
      port: 80
```

### podSelector

このフィールドでNetworkPolicyを適用するPodを選択する。
記述の方法はLabelSelectorなので、Deploymentなどで使用していたものと同様のものだ。(なので指定方法は省略させてもらう)

このフィールドは必須なのだが、空の指定をすることが出来る。
その場合は、NetworkPolicyの属するNamespace上の全てのPodが対象となる。

```yaml
podSelector: {}
```

### policyTypes

このフィールドでNetworkPolicyがIngress(受信側)のポリシーか、Egress(送信側)のポリシーか、または両方なのかを指定する。

指定できる値は `Ingress` と `Egress` でリストで指定する。

省略すると `Ingress` がセットされ、Egressのルールが設定されている場合は `Egress` もセットされる。

### ingress / egress

フィールド名の通り、受信ルールと送信ルールを指定する。

リストで指定するため、複数のルールを記述することが可能だ。

ルールの記述について掘り下げてみていこう。

#### from / to

このフィールドに受信元や送信先のルールをリストで指定する。

このフィールドを省略したり空で指定した場合は全てのトラフィックが対象となる。また、複数指定があった場合はORを取って組み合わされる。

受信元、送信先のルールの記述について見てみよう。

##### ipBlock

CIDR表記を使って部分的なIPアドレスの範囲に対しての指定をする。指定できるフィールドは以下の通り。

- `cidr` : CIDR表記でIPアドレスの範囲を指定
- `except` : `cidr` で指定した範囲内から除きたい範囲をCIDRで指定。 `cidr` で指定した範囲の外部を指定すると拒否される

最初に出したManifestの例では以下の部分で使用されている。

```yaml
ipBlock:
  cidr: 10.2.0.0/16
  except:
  - 10.2.1.0/24
```

##### namespaceSelector

Namespaceに対してのLabelSelectorでNamespaceを選択する。指定方法はDeploymentなどのLabelSelectorと同様だ。

このフィールドが与えられたが空だった場合、全てのNamespaceが選択される。

最初に出したManifestの例では以下の部分で使用されている。

```yaml
namespaceSelector:
  matchLabels:
      project: test-app
```

##### podSelector

Podに対してのLabelSelectorでPodを選択する。指定方法はDeploymentなどのLabelSelectorと同様だ。

このフィールドが与えられたが空だった場合、NetworkPolicyが属しているNamespaceの全てのPodが選択される。

最初に出したManifestの例では以下の部分で使用されている。

```yaml
podSelector:
  matchLabels:
    role: frontend
```

##### namespaceSelectorとpodSelectorを組み合わせた指定

実は `namespaceSelector` と `podSelector` を組み合わせた指定が可能だ。(普通にAPIリファレンス追ってるだけだと気づけない)

通常通り記述すると以下のようになるはずだ。

```yaml
- namespaceSelector:
    matchLabels:
        project: test-app
- podSelector:
    matchLabels:
      role: frontend
```

この設定は `project=test-app` とマッチするNamespaceにある全てのPodとNetworkPolicyが属しているNamespaceのPodで `role=frontend` とマッチするものが選択される。

しかし、このフィールドは一部のフィールドの組み合わせが許可されており、以下のような指定が可能だ。

```yaml
- namespaceSelector:
    matchLabels:
        project: test-app
  podSelector:
    matchLabels:
      role: frontend
```

なんとも分かりづらいが、 `podSelector` のハイフンが消えて、1要素になっている。

この設定は `project=test-app` とマッチするNamespaceにあるPodで `role=frontend` とマッチするものが対象になる。
要はこの記述でNamespaceとPodを同時に指定できる。

#### ports

このフィールドに受信元や送信先についてのポート番号を指定する。

このフィールドを省略したり空で指定した場合は全てのポートが対象となる。また、複数指定があった場合はORを取って組み合わされる。

指定できるフィールドは以下の通り。

- `port` : ポートを指定。ポート名か番号で指定する。省略した場合は全てのポート名と番号が選択される 
- `protocol` : プロトコルを指定。 `TCP` / `UDP` / `SCTP` から指定する。デフォルトは `TCP` だ。

## 基本的なポリシー

通常、NetworkPolicyは作成されていないため、全てのトラフィックが許可されている。

ここではNamespaceに対するネットワークのデフォルトポリシーとして使える基本的なNetworkPolicyの定義を見ていこう。

### 全ての受信トラフィックを拒否

全ての受信トラフィックを拒否するには以下のようなManifestになる。

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
spec:
  podSelector: {}
  policyTypes:
  - Ingress
```

### 全ての受信トラフィックを許可

全ての受信トラフィックを許可するには以下のようなManifestになる。

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-all
spec:
  podSelector: {}
  ingress:
  - {}
```

### 全ての送信トラフィックを拒否

全ての送信トラフィックを拒否するには以下のようなManifestになる。

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
spec:
  podSelector: {}
  policyTypes:
  - Egress
```

### 全ての送信トラフィックを許可

全ての送信トラフィックを許可するには以下のようなManifestになる。

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-all
spec:
  podSelector: {}
  egress:
  - {}
  policyTypes:
  - Egress
```

### 全ての送受信トラフィックを拒否

全ての送受信トラフィックを拒否するには以下のようなManifestになる。

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

## NetworkPolicyを使ってみる。

### 前準備

NetworkPolicyを使ってみる前に。実は今使用しているminikubeではNetworkPolicyが動作しない。

なぜ動作しないかは根深い話になるので割愛する。一旦現状の環境を作り直してNetworkPolicyが動くようにしよう。

以下のコマンドを実行し、minikubeの環境を削除する。

```plain
$ minikube delete
```

次に以下のコマンドを順に実行し、minikubeの環境を作成する。適宜CPUやMemoryの指定をしてほしい。([こちら](/posts/2018/k8sdojo-02/#minikubeを使ったkubernetesのローカル環境構築)を参照)

```plain
minikube start --network-plugin=cni --extra-config kubelet.network-plugin=cni --kubernetes-version v1.12.3
kubectl apply -f https://docs.projectcalico.org/v3.4/getting-started/kubernetes/installation/hosted/etcd.yaml
kubectl apply -f https://docs.projectcalico.org/v3.4/getting-started/kubernetes/installation/hosted/calico.yaml
```

完了したら実際にNetworkPolicyを使ってみよう。

### NetworkPolicyを使う

さて、今回は通常でIngressを拒否するPolicyをあててみよう。

以下のManifestを適用する。

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
spec:
  podSelector: {}
  policyTypes:
  - Ingress
```

```plain
$ kubectl apply -f default-deny.yaml
networkpolicy.networking.k8s.io/default-deny created
```

それではさくっとnginxのDeploymentと対応するService、それと別のターミナルで接続するためのAlpineのPodを実行しよう。

```plain
$ kubectl create deploy --image nginx nginx
deployment.apps/nginx created
$ kubectl expose deploy nginx --port 80
service/nginx exposed
```

```plain
$ kubectl run -it --rm alpine --image alpine --generator=run-pod/v1 ash
If you don't see a command prompt, try pressing enter.
/ #
```

起動したAlpineのPodからnginxにアクセスしてみよう。
デフォルトでIngressのトラフィックを拒否するルールを設定したため、接続できないはずだ。

```plain
/ # wget -T 1 -O - nginx
Connecting to nginx (10.108.165.92:80)
wget: download timed out
```

それでは今立ち上げているAlpineのコンテナからのアクセスを許可しよう。以下のようなManifestを作成する。

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-alpine-to-nginx
spec:
  podSelector:
    matchLabels:
      app: nginx
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          run: alpine 
```

上記のManifestを適用してみる。

```plain
$ kubectl apply -f allow-alpine-to-nginx.yaml
networkpolicy.networking.k8s.io/allow-alpine-to-nginx created
```

さて、再度リクエストを飛ばしてみよう。

```plain
/ # wget -T 1 -O - nginx
Connecting to nginx (10.108.165.92:80)
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
    body {
        width: 35em;
        margin: 0 auto;
        font-family: Tahoma, Verdana, Arial, sans-serif;
    }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
-                  100% |***************************************|   612   0:00:00 ETA

```

正しく接続することが出来た。試しに別のNamespaceを作成してそこのPodからリクエストを送ってみよう。

```plain
$ kubectl create ns network-policy-test
namespace/network-policy-test created
$ kubectl run -n network-policy-test -it --rm --image alpine --generator=run-pod/v1 alpine ash
If you don't see a command prompt, try pressing enter.
/ # wget -T 1 -O - nginx.default
Connecting to nginx.default (10.108.165.92:80)
wget: download timed out
```

接続できないことが分かる。それではこのコンテナから接続できるNetworkPolicyを作成してみよう。

以下のManifestを作成した。

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-from-ns-alpine-to-nginx
spec:
  podSelector:
    matchLabels:
      app: nginx
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          ns: network-policy-test
      podSelector:
        matchLabels:
          run: alpine 
```

そして先程作成したNamespaceにLabelを追加する。でないと `namespaceSelector` で選択できないからだ。

以下のコマンドでLabelを追加することが出来る。

```plain
$ kubectl label ns network-policy-test ns=network-policy-test
namespace/network-policy-test labeled
```

それでは上記のManifestを適用しよう。

```plain
$ kubectl apply -f allow-from-ns-alpine-to-nginx.yaml
networkpolicy.networking.k8s.io/allow-from-ns-alpine-to-nginx created
```

さて、先程起動していた `network-policy-test` のAlpineのPodから再度リクエストを飛ばしてみよう。

```plain
/ # wget -T 1 -O - nginx.default
Connecting to nginx.default (10.108.165.92:80)
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
    body {
        width: 35em;
        margin: 0 auto;
        font-family: Tahoma, Verdana, Arial, sans-serif;
    }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
-                  100% |***************************************|   612   0:00:00 ETA
```

接続できるようになった :tada:

この様にNetworkPolicyでPodに対してのトラフィックを制御することが出来る。


--------------------------------------------------


というわけで今回はここまで。

次回はLabel / NodeSelector / Annotationについて見ていこう。

それでは。

