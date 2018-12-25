---
title: Kubernetes道場 22日目 - Ingressについて

date: 2018-12-22T00:00:00+09:00

tags:
- kubernetes
- advent-calendar-2018
- kubernetes-dojo

resources:
- name: thumbnail
  src: header.jpg

---

この記事は [Kubernetes道場 Advent Calendar 2018](https://qiita.com/advent-calendar/2018/k8s-dojo) 22日目の記事です。

今回はIngressについて。

# Ingress

IngressはHTTPやHTTPSの外部アクセスを制御するオブジェクトだ。

バーチャルホストとパスベースのロードバランシングやSSLターミネーションなどの機能を提供する。

各機能を見ていこう。

## バーチャルホストとパスベースのロードバランシング

Ingressはパスベースのルーティングとロードバランシングをサポートしている。
この設定に必要なフィールドを紹介しよう。

- `backend` : `rules` に指定したルールにマッチしなかった場合のデフォルトのBackendを指定
  - `serviceName` : ルーティングするServiceの名前を指定
  - `servicePort` : ルーティングするServiceのポートを指定
- `rules` : ルーティングのルールを指定

`rules` を詳しく見よう。

### rulesフィールドについて(VirtualHostの設定)

rulesフィールドには以下のフィールドが指定できる。

- `host` : VirtualHostで使用するドメインを指定する。指定しなかった場合、デフォルトのルールとして機能する。
- `http.paths` : パスとルーティング先のバックエンドをリストで指定
  - `path` : 拡張POSIX正規表現でパスのルールを指定する。 `/` から始める必要がある。指定しなかった場合、デフォルトのルールとして機能する。
  - `backend` : パスにマッチしたトラフィックをルーティングする先のバックエンドを指定する。指定方法は上の `backend` と同じだ。

## バーチャルホストとパスベースのロードバランシングの設定例

バーチャルホストとパスベースのロードバランシングの指定例は以下の通りだ。

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: ingress-test
spec:
  backend:
    serviceName: default-backend
    servicePort: 80
  rules:
  - host: app1.example.com
    http:
      paths:
      - path: /hoge
        backend:
          serviceName: app1-hoge
          servicePort: 80
      - path: /fuga
        backend:
          serviceName: app1-fuga
          servicePort: 8080
  - host: app2.example.com
    http:
      paths:
      - backend:
          serviceName: app2
          servicePort: 80
```

## SSLターミネーション

IngressはSSLのターミネーションもサポートしている。

この設定に必要なフィールドを紹介しよう。

- `tls` : 証明書を格納しているSecretと対象のドメインをリストで指定
  - `hosts` : TLS証明書を適用するドメイン名をリストで指定
  - `secretName` : TLS証明証を格納しているSecretの名前を指定

## SSLターミネーションの設定例

SSLターミネーションの設定はSecretを作成する必要がある。以下が作成例だ。

```plain
$ kubectl create secret tls ingress-tls --cert=cert.pem --key=priv.pem
secret/ingress-tls created
```

このSecretを利用するように指定をした例は以下の通りだ。

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: ingress-test-tls
spec:
  rules:
  - host: app1.example.com
    http:
      paths:
      - backend:
          serviceName: app1
          servicePort: 80
  tls:
    hosts:
    - app1.example.com
    secretName: ingress-tls
```

## Ingress Controllerについて

実はIngressリソースを作成しても何も起らない。

Ingressリソースを処理してくれるIngress Controllerを導入する必要がある。

Ingress Controllerはいくつも種類がある。有名なものをいくつか紹介しよう。

- [Nginx](https://github.com/nginxinc/kubernetes-ingress)
- [HAProxy](https://github.com/jcmoraisjr/haproxy-ingress)
- [Contour](https://github.com/heptio/contour)
- [Istio](https://github.com/istio/istio)

## Ingressを使用してみる

Ingressを使ってみよう。

と、その前に、先程も書いたとおりまずIngress Controllerを導入する必要がある。

しかし、MinikubeではAddonという機能でIngress Controllerを簡単に導入することができる。

以下のコマンドを実行しよう。

```sh
$ minikube addons enable ingress
ingress was successfully enabled
```

さて、まずIngressがルーティングするバックエンドを先に作成する。

以下のManifestを作成し、適用しよう。

```yaml
---
apiVersion: v1
kind: Service
metadata:
  name: nginx
spec:
  ports:
  - port: 80
    protocol: TCP
    targetPort: 80
  selector:
    app: nginx
  type: NodePort
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - image: nginx:alpine
        name: nginx
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: httpd
spec:
  ports:
  - port: 80
    protocol: TCP
    targetPort: 80
  selector:
    app: httpd
  type: NodePort
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: httpd
spec:
  replicas: 1
  selector:
    matchLabels:
      app: httpd
  template:
    metadata:
      labels:
        app: httpd
    spec:
      containers:
      - image: httpd:alpine
        name: httpd
        ports:
        - containerPort: 80
```

```plain
$ kubectl apply -f backends.yaml
service/nginx created
deployment.apps/nginx created
service/httpd created
deployment.apps/httpd created
```

これで2つのバックエンドを作成できた。

それではIngressとして以下のManifestを作成する。

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: ingress-test
spec:
  rules:
  - http:
      paths:
      - path: /nginx
        backend:
          serviceName: nginx
          servicePort: 80
      - path: /httpd
        backend:
          serviceName: httpd
          servicePort: 80
```

それでは上のManifestを適用し、取得してみよう。

```plain
$ kubectl apply -f ingress-test.yaml
ingress.extensions/ingress-test created
$ kubectl get ingress
NAME           HOSTS   ADDRESS     PORTS   AGE
ingress-test   *       10.0.2.15   80      92s
```

さて、それではリクエストと送ってみよう。

```plain
$ curl -I http://`minikube ip`/nginx
HTTP/1.1 404 Not Found
Server: nginx/1.15.7
Date: Tue, 25 Dec 2018 01:19:44 GMT
Content-Type: text/html
Content-Length: 153
Via: 1.1 google

$ curl -I http://`minikube ip`/httpd
HTTP/1.1 404 Not Found
Date: Tue, 25 Dec 2018 01:20:51 GMT
Server: Apache/2.4.37 (Unix)
Content-Type: text/html; charset=iso-8859-1
Via: 1.1 google
Transfer-Encoding: chunked

```

404にはなっているがそれぞれnginxとhttpdからレスポンスが返ってきていることがわかる。

このようにL7の情報を使ってLoadBalancingができるのがIngressだ。使えるととても便利な機能だ。

これを詳しく知りたい方は[公式のドキュメント](https://kubernetes.io/docs/concepts/services-networking/ingress/)や各Ingress Controllerのドキュメントページを見るのがいいだろう。


--------------------------------------------------


というわけで今回はここまで。

次回は今までよく触っていたkubectlのコマンドについて網羅していこう。

それでは。

