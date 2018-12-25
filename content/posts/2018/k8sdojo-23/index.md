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

### explain        Documentation of resources



### get            Display one or many resources



### edit           Edit a resource on the server



### delete         Delete resources by filenames, stdin, resources and names, or by resources and label selector



## Deploy Commands

### rollout        Manage the rollout of a resource



### scale          Set a new size for a Deployment, ReplicaSet, Replication Controller, or Job



### autoscale      Auto-scale a Deployment, ReplicaSet, or ReplicationController



## Cluster Management Commands

### certificate    Modify certificate resources.



### cluster-info   Display cluster info



### top            Display Resource (CPU/Memory/Storage) usage.



### cordon         Mark node as unschedulable



### uncordon       Mark node as schedulable



### drain          Drain node in preparation for maintenance



### taint          Update the taints on one or more nodes



## Troubleshooting and Debugging Commands

### describe       Show details of a specific resource or group of resources



### logs           Print the logs for a container in a pod



### attach         Attach to a running container



### exec           Execute a command in a container



### port-forward   Forward one or more local ports to a pod



### proxy          Run a proxy to the Kubernetes API server



### cp             Copy files and directories to and from containers.



### auth           Inspect authorization



## Advanced Commands

### diff           Diff live version against would-be applied version



### apply          ファイル名を指定または標準入力経由でリソースにコンフィグを適用する



### patch          Update field(s) of a resource using strategic merge patch



### replace        Replace a resource by filename or stdin



### wait           Experimental: Wait for a specific condition on one or many resources.



### convert        Convert config files between different API versions



## Settings Commands

### label          Update the labels on a resource



### annotate       リソースのアノテーションを更新する



### completion     Output shell completion code for the specified shell (bash or zsh)



## Other Commands

### api-resources  Print the supported API resources on the server



### api-versions   Print the supported API versions on the server, in the form of "group/version"



### config         kubeconfigファイルを変更する



### plugin         Provides utilities for interacting with plugins.



### version        Print the client and server version information





--------------------------------------------------


というわけで今回はここまで。

次回は  について見ていこう。

それでは。

