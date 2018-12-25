---
title: Kubernetes道場 24日目 - Kubernetesの各コンポーネントについて

date: 2018-12-24T00:00:00+09:00

tags:
- kubernetes
- advent-calendar-2018
- kubernetes-dojo

resources:
- name: thumbnail
  src: header.jpg
- name: k8s-arch
  src: k8s-arch.jpg
- name: oda
  src: oda.jpg

---

この記事は [Kubernetes道場 Advent Calendar 2018](https://qiita.com/advent-calendar/2018/k8s-dojo) 24日目の記事です。

今回はKubernetesの各コンポーネントについて見ていこう。

# Kubernetesの各コンポーネントについて

Kubernetesには以下のようなコンポーネントがある。

- `kubectl`
- `etcd`
- `kube-apiserver`
- `kube-controller-manager`
- `kube-scheduler`
- `kubelet`
- `kube-proxy`
- `Container Runtime(Docker)`

各コンポーネントの全体像は以下のようになっている。

{{< img name="k8s-arch" >}}

それでは各コンポーネントについて少し詳しく見ていこう。

## Client

### kubectl

これについてはコンポーネントというほどではないが、1要素として一応出しておこう。

`kubectl` はkube-apiserverに対してリクエストを送りリソースの作成や変更・取得・削除などを行う。

`kubectl` については今までずっと触れてきているので感覚的には分かっていると思う。

今回のポイントは `kubectl` は `kube-apiserver` とやり取りを行っていることだ。

## Masterコンポーネント

### etcd

etcdはKubernetesのデータストアとして利用されている。

データは `kube-apiserver` を通して取得や格納が行われる。

`etcd` については今回の本質から少しそれるので、詳しく知りたい方は以下のリンクへどうぞ。

[etcd-io/etcd: Distributed reliable key-value store for the most critical data of a distributed system](https://github.com/etcd-io/etcd)

[etcd Documentation — etcd documentation](https://etcd.readthedocs.io/en/latest/)

### kube-apiserver

さて、ここからが本番。

`kube-apiserver` はKubernetesの中心的存在でAPIを提供しているコンポーネントだ。

他にも認証や認可の処理なども行っている。

図を確認すると分かると思うが、全ての操作はこの `kube-apiserver` を通して行われる。

### `kube-controller-manager`

`kube-controller-manager` はKubernetesのオブジェクトを処理するコントローラを実行、管理するコンポーネントだ。

この `kube-controller-manager` では以下のようなコントローラーが実行されている。

- deployment
- replicaset
- cronjob
- service

これらは一部でいくつものコントローラーが実行されている。

これで気づいた方もいるかも知れないが、大抵の場合Kubernetesオブジェクト1つに対して1つのコントローラーがある。

これらのコントローラーの実行を管理するのがこの `kube-controller-manger` だ。

### `kube-scheduler`

`kube-scheduler` はPodをNodeへスケジュールするコンポーネントだ。

Podの要求しているリソースやNodeのリソースの使用率などをみて適切なNodeを1つ選択し、PodをNodeに紐付ける(スケジュールする)。

## Nodeコンポーネント

### `kubelet`

`kubelet` はPodを起動、管理するエージェントだ。

`kube-scheduler` によって紐付けられた(スケジュールされた)Podを `kubelet` が認識して、そのPodを自身のNodeで起動させる。
また、実行しているPodの監視・管理も行う。

なので、実際にコンテナのワークロードを発行しているのはこの `kubelet` だ。

### `kube-proxy`

`kube-proxy` はKubernetesのServiceオブジェクトを元にルーティングを行う。

実体はiptablesのルールを発行し、パケットの制御を行っている。

この実装は切り替えることができ、以下の中から選択できる。

- userspace
- iptables
- ipvs(experimental)

デフォルトでiptablesが使われる。

### `Container Runtime(Docker)`

Cotainer Runtimeはkubeletからの呼び出され、コンテナの実行をする。

KubernetesではこのContainer Runtimeを差し替えることが出来る。
他のContainer Runtimeは以下のようなものがある。

- [Docker](https://www.docker.com/)
- [containerd](https://containerd.io/)
- [cri-o](https://cri-o.io/)
- [gVisor](https://github.com/google/gvisor)
- [Kata Containers](https://katacontainers.io/)

大抵のKubernetesのマネージドサービスではDockerが使用されている。
(実際の所Dockerの中身はcontainerdだ)

## Kubernetesのアーキテクチャの要点

再度図を見てみよう。

{{< img name="k8s-arch" >}}

Kubernetesのアーキテクチャの要点としては以下の2点だ。

- 全ての処理は `kube-apiserver` を通して実行される
- `kube-apiserver` から取得した状態から現状の状態を比較し、あるべき状態(取得した状態)へ変更をかける

{{< img name="oda" size="small" >}}

この図のように、状態をみて(current state)、あるべき状態(desire state)と差分をとり、処理を実行する。

この考え方を抑えることで、これまでの話も理解が進むのではないかと思う。
また、Kubernetesの機能を拡張させる際にこの考え方は必須なので把握しておくに越したことはない。

## その他のコンポーネント

ついでにKubernetesに追加で導入できるコンポーネントを紹介しておこう。

- dashboard: Kubernetes用のDashboardを提供
- coredns: Serviceの名前解決をする機能を提供
- metrics-server: NodeやPodのメトリクス収集を行う
- fluentd: コンテナのログ収集を行う

など。いくつか自身での設定も必要だが、簡単に導入できるものもある。


--------------------------------------------------


というわけで今回はここまで。

次回は最終回。Kubernetesの情報元やコミュニティについて見ていこう。

それでは。

