---
title: Kubernetes道場 23日目 - kubectlを網羅する

date: 2018-12-23T00:00:00+09:00

tags:
- kubernetes
- advent-calendar-2018
- kubernetes-dojo

resources:
- name: thumbnail
  src: header.jpg

---

この記事は [Kubernetes道場 Advent Calendar 2018](https://qiita.com/advent-calendar/2018/k8s-dojo) 23日目の記事です。

今回は `kubectl` のサブコマンドについて網羅していこう。

# kubectlについて

とりあえず、kubectlのヘルプを見てみよう。

```plain
$ kubectl
kubectl controls the Kubernetes cluster manager.

Find more information at: https://kubernetes.io/docs/reference/kubectl/overview/

Basic Commands (Beginner):
  create         Create a resource from a file or from stdin.
  expose         Take a replication controller, service, deployment or pod and expose it as a new Kubernetes Service
  run            Run a particular image on the cluster
  set            Set specific features on objects

Basic Commands (Intermediate):
  explain        Documentation of resources
  get            Display one or many resources
  edit           Edit a resource on the server
  delete         Delete resources by filenames, stdin, resources and names, or by resources and label selector

Deploy Commands:
  rollout        Manage the rollout of a resource
  scale          Set a new size for a Deployment, ReplicaSet, Replication Controller, or Job
  autoscale      Auto-scale a Deployment, ReplicaSet, or ReplicationController

Cluster Management Commands:
  certificate    Modify certificate resources.
  cluster-info   Display cluster info
  top            Display Resource (CPU/Memory/Storage) usage.
  cordon         Mark node as unschedulable
  uncordon       Mark node as schedulable
  drain          Drain node in preparation for maintenance
  taint          Update the taints on one or more nodes

Troubleshooting and Debugging Commands:
  describe       Show details of a specific resource or group of resources
  logs           Print the logs for a container in a pod
  attach         Attach to a running container
  exec           Execute a command in a container
  port-forward   Forward one or more local ports to a pod
  proxy          Run a proxy to the Kubernetes API server
  cp             Copy files and directories to and from containers.
  auth           Inspect authorization

Advanced Commands:
  diff           Diff live version against would-be applied version
  apply          ファイル名を指定または標準入力経由でリソースにコンフィグを適用する
  patch          Update field(s) of a resource using strategic merge patch
  replace        Replace a resource by filename or stdin
  wait           Experimental: Wait for a specific condition on one or many resources.
  convert        Convert config files between different API versions

Settings Commands:
  label          Update the labels on a resource
  annotate       リソースのアノテーションを更新する
  completion     Output shell completion code for the specified shell (bash or zsh)

Other Commands:
  api-resources  Print the supported API resources on the server
  api-versions   Print the supported API versions on the server, in the form of "group/version"
  config         kubeconfigファイルを変更する
  plugin         Provides utilities for interacting with plugins.
  version        Print the client and server version information

Usage:
  kubectl [flags] [options]

Use "kubectl <command> --help" for more information about a given command.
Use "kubectl options" for a list of global command-line options (applies to all commands).
```

この通り、多くのコマンドがある。カテゴリごとで見ていこう。

## Basic Commands (Beginner)

基礎コマンド初級編。

### create

createコマンドはリソースの作成を行う。

今までも何度か扱ってきたが、 `-f` オプションとManifestファイルを使った作成方法やサブコマンドを利用した方法がある。

サブコマンドを使った方法で作成できるリソースは以下のものだ。

- clusterrole
- clusterrolebinding
- configmap
- deployment
- job
- namespace
- poddisruptionbudget
- priorityclass
- quota
- role
- rolebinding
- secret
- service
- serviceaccount

以下が使用例だ。

```bash
kubectl create -f deployment.yaml

kubectl create namespace test-namespace
```

### expose

Deploymentなどのリソースを公開するためのコマンドだ。実際にはそれに対応するServiceを作成する。

Deploymentに対応したServiceをサクッと作成したいときに便利なコマンドだ。

以下が使用例だ。

```bash
kubectl expose deploy nginx --port 80 --type NodePort
```

### run

DeploymentやJobの実行を行うコマンドだ。

createとかなり近い感覚を感じるが、こちらは作成したDeploymentにアタッチすることができる。

以下が使用例だ。

```bash
kubectl run nginx --image nginx --replicas 3

kubectl run -it --rm alpine --image alpine
```

### set

 指定リソースの項目を設定する。サブコマンドには以下の項目がある。

- `env` : 環境変数の設定
- `image` : イメージの設定
- `resources` : リソースのリクエストやリミットの設定
- `selector` : Selectorの設定
- `serviceaccount` : ServiceAccountの設定
- `subject` : RoleBindingやClusterRoleBindingのUser / Group / ServiceAccountを設定

自分の経験上このコマンドはあまり使用していない。

以下が使用例だ。

```bash
kubectl set image deploy/nginx nginx=nginx:alpine

kubectl set env deploy nginx HOGE=FUGA
```

## Basic Commands (Intermediate)

基礎コマンド中級編。

### explain

リソースのドキュメントが表示できる。

コマンドの引数にフィールドを `.` でつなげることでそのオブジェクトに含まれるフィールドのドキュメントが出力される。

このフィールドなんだったっけ？という疑問にCLIで解答が探せるぞ！

以下が使用例だ。

```bash
kubectl explain pod.spec.containers

kubectl set env pdb.spec
```

### get

リソースの取得・表示だ。

LabelSelectorを使った取得( `-l`, `--selector` )や全Namespaceからの取得( `--all-namespaces` )、出力フォーマットの指定( `-o` , `--output` )などのオプションを利用して柔軟なリソースの取得を行える。

以下が使用例だ。

```bash
kubctl get pod --all-namespaces

kubectl get deploy -l env=prod -o yaml
```

### edit

指定リソースをエディタで編集する。

運用時には選択肢として入らないと思うが、テスト・開発中ではかなり便利だと思う。

また、 `KUBE_EDITOR` という環境変数にエディタをセットしておくとそのエディタで編集することが出来る。

以下が使用例だ。

```bash
kubectl edit deploy nginx

KUBE_EDITOR=nano kubectl edit svc nginx
```


### delete

リソースの削除だ。

リソースの選択についてはLabelSelector( `-l`, `--selector` )も使える。

また、名前空間にあるリソースを一掃する際には `--all` が便利だ。ただ、一掃できる危険なコマンドなので注意してほしい。

Podがなかなか削除されないときなどに `--grace-period=0 --force` という組み合わせたオプションを利用することがよくあるので覚えておくと良いかも知れない。

以下が使用例だ。

```bash
kubectl delete -f nginx.yaml

kubectl delete deploy --all

kubectl delete pod nginx --grace-period=0 --force
```

## Deploy Commands

デプロイに関するコマンド。

### rollout

 リソースのロールアウトを管理するコマンドだ。以下のサブコマンドを持っている。

 - `history` : ロールアウト履歴の表示
 - `pause` : ロールアウトの一時停止
 - `resume` : ロールアウトの再開
 - `status` : ロールアウトのステータスを表示
 - `undo` : ロールバックの実行

 このコマンドについては [Kubernetes道場 8日目 - ReplicaSet / Deploymentについて](/posts/2018/k8sdojo-08/) で扱っているので参考にすると良いだろう。

以下が使用例だ。

```bash
kubectl rollout history deploy nginx

kubectl rollout undo deploy nginx --to-revision=2
```

### scale

リソースのスケール処理を行う。具体的にはリソースの `replicas` の変更を行う。

スケールするためだけであれば `apply` や `edit` などよりこのコマンドを利用したほうが簡単だ。(操作性的な観点のみ)

以下が使用例だ。

```bash
kubectl scale deploy nginx --replicas=5
```

### autoscale

オートスケールのルールを設定する。

Podの最大数( `--max` )だけ指定が必須だ。 CPU使用率を使ったスケール( `--cpu-percent` )を設定することも可能だ。

以下が使用例だ。

```bash
kubectl autoscale deploy nginx --max=20 --cpu-percent=80
```

## Cluster Management Commands

クラスタ管理に関するコマンド。

### certificate    Modify certificate resources.

KubernetesのCSRを管理するコマンドだ。

以下が使用例だ。

サブコマンドで `approve` と `deny` があり、CSRを許可または拒否する。

以下が使用例だ。

```bash
kubectl certificate approve user-request-01
```

### cluster-info

クラスタの情報を表示する。

`cluster-info` だけを実行するとKubernetesのMasterの接続情報を表示する。

また `dump` サブコマンドがあり、クラスタの状態を出力する。 `--all-namespace` オプションを付けてクラスタ全体の状態をdumpすることも可能だ。

以下が使用例だ。

```bash
kubectl cluster-info

kubectl cluster-info dump --all-namespaces --output-directory=path/to/dump
```

### top

NodeやPodのリソース使用量を表示する。

このコマンドを使用するにはheapsterというコンポーネントが入っている必要がある。

以下が使用例だ。

```bash
kubectl top node

kubectl top pod -l app=nginx
```

### cordon

指定Nodeをスケジュールできないようにする。

このコマンドは [Kubernetes道場 21日目 - Cordon / Drain / PodDisruptionBudgetについて](/posts/2018/k8sdojo-21/) で解説しているので、詳しく知りたい方は参考にしてほしい。

以下が使用例だ。

```bash
kubectl cordon minikube
```

### uncordon

指定Nodeをスケジュールできるようにする。

このコマンドは [Kubernetes道場 21日目 - Cordon / Drain / PodDisruptionBudgetについて](/posts/2018/k8sdojo-21/) で解説しているので、詳しく知りたい方は参考にしてほしい。

以下が使用例だ。

```bash
kubectl uncordon minikube
```

### drain

Nodeを停止させる前準備としての処理を行う。具体的にはcordonとPodのEvictionを行う。

このコマンドは [Kubernetes道場 21日目 - Cordon / Drain / PodDisruptionBudgetについて](/posts/2018/k8sdojo-21/) で解説しているので、詳しく知りたい方は参考にしてほしい。

以下が使用例だ。

```bash
kubectl drain --ignore-daemonsets --force minikube
```

### taint

NodeにTaintを追加する。

このコマンドは [Kubernetes道場 18日目 - Affinity / Anti-Affinity / Taint / Tolerationについて](/posts/2018/k8sdojo-18/) で解説しているので、詳しく知りたい方は参考にしてほしい。

以下が使用例だ。

```bash
kubectl taint node minikube dedicated=admin:NoSchedule
```

## Troubleshooting and Debugging Commands

トラブルシューティングとデバッグに関するコマンド。

### describe

指定したリソースの詳細を表示する。

リソースの設定や、状態、イベントの履歴などが表示される。

以下が使用例だ。

```bash
kubectl describe deploy nginx
```

### logs

コンテナのログを表示する。

このコマンドはアプリケーションのデバッグの際に非常に有用なので覚えておくといいだろう。

Podに複数のコンテナがある場合は `-c` オプションでコンテナを選択する。

以下が使用例だ。

```bash
kubectl logs app -c memcached

kubectl logs -f nginx
```

### attach

Pod内のコンテナにアタッチする。

このコマンドはほとんど使うことはないだろう。Dockerのattachコマンドと内容は同じだ。

以下が使用例だ。

```bash
kubectl attach -it app -c memcached
```

### exec

Pod内のコンテナでコマンドを実行する。

このコマンドはデバッグの際に非常に有用なので覚えておくといいだろう。

以下が使用例だ。

```bash
kubectl exec -it nginx bash
```

### port-forward

Podに対してのポートフォワードを行う。

ローカルで実行するkubectlとPod間でポートフォワードを作成してくれる。

ポートの指定方法は以下の方法がある。

- `8080` : ローカルの8080番とPodの8080番の間で作成
- `8080:80` : ローカルの8080番とPodの80番の間で作成
- `:80` : ローカルのランダムなポート番号とPodの8080番の間で作成

以下が使用例だ。

```bash
kubectl port-forward deploy/nginx 8080:80
```

### proxy

KubernetesのAPIサーバーへのProxyサーバーとして動作させる。

これのいいところはkubectlで使用してた認証情報を利用してくれるところだ。

これはKubernetesを拡張したい人向けだったりするので、アプリ開発者の方などは特に気にしなくていいと思う。

以下が使用例だ。

```bash
kubectl proxy --port 8080
```

### cp

PodのコンテナへファイルをまたはPodのコンテナからファイルをコピーする。

Podのコンテナからファイルをコピーしてくる場合はまだいいが、Podのコンテナへファイルをコピーする操作は可能だが、運用的な観点から避けたほうが良いだろう。

この操作が可能なのは対象のコマンドにtarコマンドが入っているコンテナのみだ。

以下が使用例だ。

```bash
kubectl cp  nginx:/etc/nginx nginx-conf
```

### auth

認証認可に関するコマンドだ。サブコマンドが2つある。

- `can-i` : 指定した操作が許可されているかを確認するコマンド
- `reconcile` : Role / RoleBinding / ClusterRole / ClusterRoleBindingのルールをチェックする

通常ほぼこのコマンドを触ることはないが、 `can-i` は権限の確認、 `reconcile` はRBACのリソースを適用する前に実行しておくと良いだろう。

以下が使用例だ。

```bash
kubectl can-i create pods/nginx

kubectl reconcile -f rbac-rules.yaml
```

## Advanced Commands

上級者向けコマンド。

といっても割と使うものもある。

### diff

指定したリソースのdiffを出力する。

diffがあった場合にexit statusが変化するためCIなどの差分チェックなどで利用できるかも。

以下が使用例だ。

```bash
kubectl diff -f nginx.yaml
```

### apply

指定したリソースの設定を適用する。

ない場合は作成され、既にある場合は差分を適用する。

実行時に明確な作成や更新、という意味をもたせる意味がないのであればこのコマンドで一本化できるので非常に便利だ。

以下が使用例だ。

```bash
kubectl apply -f nginx.yaml
```

### patch

指定したリソースにパッチを当てる。

`-p` オプションで変更したい部分だけのオブジェクトを指定する。

なれるまで大変だが、なれると少しの変更についてはこのpatchコマンドが使いやすくなる。かも。:sweat_smile:

以下が使用例だ。

```bash
kubectl patch pod nginx -p '{"spec":{"containers":[{"name":"nginx","image":"nginx:alpine"}]}}'
```

### replace

リソースを置き換える。

`kubectl apply` のリソースの更新の別コマンドと覚えておくとよいだろう。

1. 作成
  - `kubectl create`
  - `kubectl apply`
2. 更新
  - `kubectl replace`
  - `kubectl apply`
3. 削除 
  - `kubectl delete`
  - `kubectl apply --prune` OR `kubectl delete`

このような関係になっていると私は理解している。こう見ると `apply` が便利すぎる。。。

以下が使用例だ。

```bash
kubectl replace -f nginx.yaml
```

### wait

指定したリソースの状態になるまで待機する。

v1.13.1現在でこの機能はExperimentalだ。なのでここでは詳しくは解説しない。

使用例だけ載せておこう。

```bash
kubectl wait --for=condition=Ready pod/nginx
```

### convert

ManifestのAPIバージョン間の変換を行う。

`--output-version` オプションで変換後のバージョンを指定できる。

使用例だけ載せておこう。

```bash
kubectl convert -f nginx.yaml
```

## Settings Commands

### label

リソースにLabelを追加、更新する。

このコマンドは [Kubernetes道場 17日目 - Label / NodeSelector / Annotationについて](/posts/2018/k8sdojo-17/) で解説しているので、詳しく知りたい方は参考にしてほしい。

以下が使用例だ。

```bash
kubectl label pod/nginx env=prod

kubectl label pod/nginx role-
```

### annotate

リソースにアノテーションを追加、更新する。

このコマンドは [Kubernetes道場 17日目 - Label / NodeSelector / Annotationについて](/posts/2018/k8sdojo-17/) で解説しているので、詳しく知りたい方は参考にしてほしい。

以下が使用例だ。

```bash
kubectl annotation pod/nginx descriptioin="example application."

kubectl annotation pod/nginx descriptioin-
```

### completion

bashやzshの補完スクリプトを出力する。

以下が使用例だ。

```bash
kubectl completion bash

kubectl completion zsh
```

## Other Commands

その他のコマンド。

### api-resources

サポートしているリソースを表示する。

`--namespaced` オプションでNamespaceで分離される/されないリソースのみを表示できる。

また、このコマンドでリソースの短縮形の確認が可能だ。

以下が使用例だ。

```bash
kubectl api-resources

kubectl api-resources --namespaced=false
```

### api-versions

サポートしているAPIバージョンを表示する。

形式は `<Group>/<Version>` で出力される。

以下が使用例だ。

```bash
kubectl api-versions
```

### config

kubeconfigの設定を変更する。

このコマンドには以下のサブコマンドがある。

- `current-context` : 現在使用しているコンテキストの表示
- `use-context` : 使用するコンテキストの選択
- `rename-context` : コンテキストのリネーム
- `get-contexts` : コンテキストの取得
- `set-context` : コンテキストの追加/更新
- `delete-context` : コンテキストの削除
- `get-clusters` : クラスタ情報の取得
- `set-cluster` : クラスタ情報の追加/更新
- `delete-cluster` : クラスタ情報の削除
- `set-credentials` : クレデンシャルの追加/更新
- `set` : プロパティ名と値を指定した情報の追加/更新
- `unset` : プロパティの削除
- `view` : kubeconfigの表示

このコマンドだけで1記事かけそうな物量なので別の時に解説できればと思う。

以下が使用例だ。

```bash
kubectl config use-context minikube

kubectl config view
```

### plugin

kubectlのプラグインについてのコマンドだ。

v1.13.1現在ではサブコマンドで `list` のみが実行できる。このサブコマンドは利用できるpluginをリストアップしてくれる。

以下が使用例だ。

```bash
kubectl plugin list
```

### version

kubectlのバージョンとサーバー側のバージョンを表示する。

`--client` を指定することでサーバーに通信せず、kubectlのバージョンのみ表示するようになる。

以下が使用例だ。

```bash
kubectl version

kubectl version --client
```


--------------------------------------------------


というわけで今回はここまで。

次回はKubernetesの各コンポーネントについて見ていこう。

それでは。

