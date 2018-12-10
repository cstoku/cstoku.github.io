---
title: Kubernetes道場 9日目 - Serviceについて

date: 2018-12-09T00:00:00+09:00

tags:
- kubernetes
- advent-calendar-2018
- kubernetes-dojo

resources:
- name: thumbnail
  src: header.jpg
- name: clusterip
  src: clusterip.jpg
- name: nodeport
  src: nodeport.jpg
- name: loadbalancer
  src: loadbalancer.jpg
- name: externalname
  src: externalname.jpg

---


この記事は [Kubernetes道場 Advent Calendar 2018](https://qiita.com/advent-calendar/2018/k8s-dojo) 9日目の記事です。

今回はServiceについて。

# Serviceについて

ServiceはPodへの接続を解決してくれる抽象的なオブジェクトだ。端的にはSelectorで選択したPodをUpstreamとしたLBだ。

Serviceには4つの種類がある。

- ClusterIP
- NodePort
- LoadBalancer
- ExternalName

それぞれ見ていこう。

## ClusterIP

{{< img name="clusterip" >}}

ClusterIPはKubernetes内での通信で利用する。クラスタ内でIPアドレスが払い出され、それを利用してPod間で通信を行う。

### ClusterIPの設定について

#### clusterIP

`clusterIP` にIPアドレスを指定することで指定されたIPアドレスでServiceが作成される。

空文字や指定しなかった場合、ランダムでClusterIPが選択・設定される。

`None` を指定するとHeadless Serviceを作成することができる。これについては後で解説する。

#### ports

`ports` にServiceでのポートの転送設定を配列で指定する。

- `name` : ポートの名前を指定する。[DNS_LABEL](https://tools.ietf.org/html/rfc1035#page-8) に従っている必要があり、Service定義内でユニークである必要がある。また、1つ以上のポートを指定する場合 `name` が指定必須になる。
- `port` : ServiceでExposeするポートを指定する。
- `targetPort` : Serviceで転送する先のポートを指定する。またはPod内で定義されているNamedPortを指定する。指定されなかった場合、 `port` で指定されたポートを利用する。
- `protocol` : `port` で使用するプロトコルを指定する。 `TCP` / `UDP` / `SCTP` を指定できる。デフォルトは `TCP`。

以下が指定の例だ。

```yaml
ports:
- name: http
  port: 80
  targetPort: 8080
  protocol: TCP
```

#### selector

Label SelectorでトラフィックをルーティングするPodを選択する。

ここで指定するLabel SelectorはDeploymentやReplicaSetで使用したものとは少し違う。ServiceのLabel Selectorは単純で `matchLabels` の指定方法を `matchLabels` を抜いた状態で記述する。

以下が指定の例だ。

```yaml
selector:
  app: nginx
  tier: frontend
```

#### type

Serviceの種類を指定する。

- `clusterIP`
- `nodePort`
- `loadBalancer`
- `externalName`

上記の4つの中から選択し、指定する。

#### publishNotReadyAddresses

`publishNotReadyAddresses` をTrueにすると、ReadyになってないPodのアドレスも公開するようになる。デフォルトはFalse。

#### sessionAffinity

セッションアフィニティーを有効にするかを指定する。 `ClientIP` か `None` から選択する。デフォルトは `None` だ。

セッションアフィニティーについての設定をする際は `sessionAffinityConfig` に指定する。 詳細は[こちら](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.13/#sessionaffinityconfig-v1-core)へ

例は以下の通りだ。

```yaml
sessionAffinity: ClientIP
sessionAffinityConfig:
  clientIP:
    timeoutSeconds: 3600
```

## NodePort

{{< img name="nodeport" >}}

NodePortはKubernetesのNodeのランダムなポートを使用して外部のサーバーからの疎通性を取ってくれる。
その後はClusterIPのServiceと同様だ。

### NodePortの設定について

#### externalIPs

NodePortで公開する際のNodeのIPアドレスをリストで指定する。

#### externalTrafficPolicy

外部からのトラフィックの処理の仕方を指定する。 `Local` と `Cluster` が指定できる。

- `Local` : Nodeでトラフィックを受けたあとに別Nodeへのホップを無効にする。トラフィックの処理が偏る可能性がある。
- `Cluster` : Nodeでトラフィックを受けたあとに別Nodeへのホップを有効にする。別のNodeへホップを許可することでトラフィック処理を分散できる。

デフォルトは `Cluster` だ。

## LoadBalancer

{{< img name="loadbalancer" >}}

LoadBalancerはNodePortのServiceを作成した上で、さらに外部のLoadBalanerを作成し、LoadBalancerのUpstreamとしてNodePortで疎通性を取っているポートへ転送するよう設定してくれる。

実は、 ClusterIP / NodePort / LoadBalancer はそれぞれ拡張されている形で実装されている。

### LoadBalancerの設定について

#### healthCheckNodePort

ヘルスチェック用のNodePortを指定することができる。指定しなかった場合はKubernetesが提供しているAPIが使用され設定される。

このフィールドは `type` が `LoadBalancer` でかつ `externalTrafficPolicy` が `Local` の際にのみ有効になる。

#### loadBalancerIP

LoadBalancerで取得するIPアドレスを指定できる。サポートされていないKubernetesクラスタでは無視される。

#### loadBalancerSourceRanges

LoadBalancerへアクセスできるIPアドレスのレンジを指定できる。サポートされていないKubernetesクラスタでは無視される。

## ExternalName

{{< img name="externalname" >}}

ExternalNameはこれまでのServiceとは違う。ExternalNameは外部のサービスに対してのエイリアス(別名)を作成できる。

このExternalNameの機能はKubernetesにDNSコンポーネントが導入されている必要がある。

### ExternalNameの設定について

#### externalName

外部へ参照するための名前を指定する。[RFC-1123 hostname](https://tools.ietf.org/html/rfc1123)に従っている必要がある。


# Service作成してみる

Serviceを作成する、前に。Serviceがトラフィックを転送する先のDeployment(Pod)を作成しましょう。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx
        ports:
        - containerPort: 80
```

上記のManifestを適用しよう。

```plain
$ kubectl apply -f deploy.yaml
deployment.apps "nginx" created
$ kubectl get deploy
NAME      DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
nginx     3         3         3            3           13s
$ kubectl get po
NAME                     READY     STATUS    RESTARTS   AGE
nginx-7db75b8b78-4wfgd   1/1       Running   0          16s
nginx-7db75b8b78-dfc5t   1/1       Running   0          16s
nginx-7db75b8b78-pmk4p   1/1       Running   0          16s
```

Podができました。このPodにルーティングするServiceを作成してみましょう。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx
spec:
  selector:
    app: nginx
  ports:
  - port: 80
```

上記のManifestを適用してServiceを作成する。

```plain
$ kubectl apply -f svc.yaml
service "nginx" created
```

Serviceを取得するにはserviceと指定するか、短縮形のsvcを指定する。

```plain
$ kubectl get svc
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP   15m
nginx        ClusterIP   10.107.90.221   <none>        80/TCP    1m
```

また、allを指定すると

- Deployment
- ReplicaSet
- Pod
- Service

を取得できる。

```plain
$ kubectl get all
NAME                     READY     STATUS    RESTARTS   AGE
nginx-7db75b8b78-4wfgd   1/1       Running   0          5m
nginx-7db75b8b78-dfc5t   1/1       Running   0          5m
nginx-7db75b8b78-pmk4p   1/1       Running   0          5m

NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP   16m
nginx        ClusterIP   10.107.90.221   <none>        80/TCP    2m

NAME      DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
nginx     3         3         3            3           5m

NAME               DESIRED   CURRENT   READY     AGE
nginx-7db75b8b78   3         3         3         5m
```

ついでにNodePortのServiceも作成してみよう。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-np
spec:
  selector:
    app: nginx
  ports:
  - port: 80
  type: NodePort
```

上記のManifestを適用する。

```plain
$ kubectl apply -f svc-np.yaml
service "nginx-np" created
$ kubectl get svc
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP        18m
nginx        ClusterIP   10.107.90.221   <none>        80/TCP         4m
nginx-np     NodePort    10.102.99.100   <none>        80:32109/TCP   34s
```

ここでNodePortとして利用されているポートは `32109` となっている。

更にLoadBalancerも作成してみよう、といきたいところだが。
実はminikubeではLoadBalancerはサポートされていない。なので試したい方はGKEなどのマネージドサービスのKubernetesを試してみてほしい。

さて、次に作成したServiceを使用してみよう。

# Serviceの使用方法

接続元のPodを作ってみましょう。 `kubectl run` コマンドを使うと簡単にDeploymentを作成することができる。

また、 `--rm` オプションを使用することでコンテナが終了した際にDeploymentも削除してくれる。

以下のコマンドを実行してAlpineイメージのコンテナを起動してみよう。

```plain
$ kubectl run alpine -it --rm --image alpine -- ash
If you don't see a command prompt, try pressing enter.
/ #
```

さて、Serviceには2つの利用方法がある。環境変数を利用する方法とDNSを利用する方法だ。

## 環境変数を利用したServiceへの接続

Alpineコンテナでenvコマンドを実行してみよう。

```alpine
/ # env
NGINX_NP_SERVICE_HOST=10.102.99.100
KUBERNETES_PORT=tcp://10.96.0.1:443
KUBERNETES_SERVICE_PORT=443
HOSTNAME=alpine-7bd47f56bc-wjhlr
SHLVL=1
HOME=/root
NGINX_PORT_80_TCP=tcp://10.107.90.221:80
NGINX_NP_PORT=tcp://10.102.99.100:80
NGINX_NP_SERVICE_PORT=80
NGINX_NP_PORT_80_TCP_ADDR=10.102.99.100
NGINX_NP_PORT_80_TCP_PORT=80
TERM=xterm
NGINX_NP_PORT_80_TCP_PROTO=tcp
KUBERNETES_PORT_443_TCP_ADDR=10.96.0.1
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
NGINX_SERVICE_HOST=10.107.90.221
KUBERNETES_PORT_443_TCP_PORT=443
KUBERNETES_PORT_443_TCP_PROTO=tcp
NGINX_NP_PORT_80_TCP=tcp://10.102.99.100:80
NGINX_SERVICE_PORT=80
NGINX_PORT=tcp://10.107.90.221:80
KUBERNETES_SERVICE_PORT_HTTPS=443
KUBERNETES_PORT_443_TCP=tcp://10.96.0.1:443
KUBERNETES_SERVICE_HOST=10.96.0.1
PWD=/
NGINX_PORT_80_TCP_ADDR=10.107.90.221
NGINX_PORT_80_TCP_PORT=80
NGINX_PORT_80_TCP_PROTO=tcp
```

環境変数にServiceの情報がセットされている。これを利用してServiceへ接続することができる。環境変数で格納されているものは以下のようなものがある。

- `{svc-name}_SERVICE_HOST` : ServiceのIPアドレス
- `{svc-name}_PORT` : ServiceのURL表記
- `{svc-name}_SERVICE_PORT_{port-name}` : Serviceのポート番号
- `{svc-name}_PORT_{port-num}_TCP_ADDR` : ServiceのIPアドレス
- `{svc-name}_PORT_{port-num}_TCP_PORT` : Serviceのポート番号
- `{svc-name}_PORT_{port-num}_TCP_PROTO` : Serviceのプロトコル
- `{svc-name}_PORT_{port-num}_TCP` : ServiceのURL表記

この情報を使って `wget` でアクセスしてみよう。

```plain
/ # wget -O - $NGINX_SERVICE_HOST
Connecting to 10.107.90.221 (10.107.90.221:80)
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
-                    100% |********************************************|   612   0:00:00 ETA
```

Serviceを使用してPodのnginxにアクセスすることができた。


## DNSを利用したServiceへの接続

KubernetesにDNSコンポーネントが導入されている場合、Service名を問い合わせるとServiceのIPアドレスを返してくれる。

確認してみよう。

```plain
/ # nslookup nginx
nslookup: can't resolve '(null)': Name does not resolve

Name:      nginx
Address 1: 10.107.90.221 nginx.default.svc.cluster.local
```

`nginx` で問い合わせたら `10.107.90.221` というIPアドレスを返してくれていることがわかる。 `nginx` で名前引きができているのでこれを使ってwgetでアクセスしてみよう。

```plain
/ # wget -O - nginx
Connecting to nginx (10.107.90.221:80)
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
-                    100% |********************************************|   612   0:00:00 ETA
```

Service名でアクセスすることができた。

# minikubeでのNodePortへのアクセス

先程確認したが、Serviceを取得してNodePortのポート番号が取得できていた。

```plain
$ kubectl get svc/nginx-np
NAME       TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
nginx-np   NodePort   10.102.99.100   <none>        80:32109/TCP   34m
```

このポート番号でアクセスすればnginxの画面が表示できる。minikubeでは `minikube service` というコマンドにService名を渡すとNodePortで公開されているServiceのURLを組み立てて表示してくれる。

```plain
$ minikube service nginx-np --url
http://192.168.99.100:32109
```

このコマンドを実行して表示されたURLに接続すると、nginxの画面が表示されたはずだ。これはServiceのNodePortを使用してPodのコンテナに接続している。

また、 `--url` を指定せずに実行すると可能な場合はブラウザを起動し表示してくれる。

# Headless Service

Serviceには少し特殊な使い方ができる。それはHeadless Serviceというもので、 `clusterIP` に `None` を指定することで作成することができる。

作成してみよう。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-headless
spec:
  selector:
    app: nginx
  clusterIP: None
```

上記のManifestを適用してみる。

```plain
$ kubectl apply -f svc-headless.yaml
service "nginx-headless" created
$ kubectl get svc/nginx-headless
NAME             TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
nginx-headless   ClusterIP   None         <none>        <none>    11s
```

Cluster IPがNoneで作成されていることがわかる。

このHeadless Serviceの使い方はDNSを引いてみるとわかる。

```plain
$ kubectl run alpine -it --rm --image alpine -- ash
If you don't see a command prompt, try pressing enter.
/ # nslookup nginx-headless
Server:         10.96.0.10
Address:        10.96.0.10#53

Name:   nginx-headless.default.svc.cluster.local
Address: 172.17.0.3
Name:   nginx-headless.default.svc.cluster.local
Address: 172.17.0.2
Name:   nginx-headless.default.svc.cluster.local
Address: 172.17.0.6
```

このようにHeadless Serviceは名前引きすると直接Podのアドレスを返してくれるようになる。

これでPod内から別のPodの数、IPアドレスの状況を知ることができる。また、 `publishNotReadyAddresses` を調整してReadyじゃないPodを表示に含めることもできる。


--------------------------------------------------


というわけで今回はここまで。

次回はLivenessProbe / ReadinessProbeについて見ていこう。

それでは。

