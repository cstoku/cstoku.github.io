---
title: Kubernetes道場 2日目 - Kubernetesのローカル環境について

date: 2018-12-02T00:00:00+09:00

tags:
- kubernetes
- advent-calendar-2018
- kubernetes-dojo

resources:
- name: thumbnail
  src: header.jpg
- name: microk8s
  src: microk8s.jpg
- name: telepresence
  src: telepresence.jpg
- name: docker-for-native
  src: docker-for-native.jpg
- name: minikube
  src: minikube.jpg

---

Kubernetes道場 2日目の記事です。

今回はKubernetesのローカル環境を構築する。

# Kubernetesのローカル環境の構築手段

Kubernetesをローカルで扱うにはいくつかの手段・ツールがある。

- telepresence
- microk8s
- Docker for Windows/Mac
- minikube

## [microk8s](https://microk8s.io/)

{{< img name="microk8s" size="medium" >}}

microk8sはシングルノードのKubernetesクラスタを構築するソリューションだ。 Canonicalが開発している。

最新のKubernetesクラスタを簡単にすばやく構築することができ、様々な機能が提供されている。

ですがsnapパッケージで提供されており、Linuxでしか使用することが出来ない。

なので今回の選択肢からは外す。 :cry:

## [Telepresence](https://www.telepresence.io/)

{{< img name="telepresence" size="medium" >}}

TelepresenceはKubernetesのローカル開発を支援するツールだ。

このツールはローカル開発で使うものだが、実際のKubernetesクラスタはリモートのものを使用する。 
なのでローカルマシンのリソースもあまり消費せずに開発することが出来るので快適に開発が出来るだろう。
また、Kubernetesで動作しているアプリとローカルで開発しているアプリをプロキシして通信できるようにしてくれる。

その他にも非常に便利な機能が多くあるが、今回はアプリケーション開発ではなくKubernetesについての学習なので今回はパス。

一応、ローカル環境という意味で紹介した。後日是非まとめたい所存。

## [Docker for Windows/Mac](https://docs.docker.com/)

{{< img name="docker-for-native" size="medium" >}}

Docker for WindowsとDocker for MacはWindowsとMacのネイティブの仮想化環境を使ってDockerを動作させるプラットフォーム。

このプラットフォームではKubernetes Integrationが提供されており、
インストール後いくつかの手順を踏むことでKubernetesクラスタを展開することができる。

WindowsやMacを使っている方はこの方法でも問題ないが、Linuxが同様の方法では構築できず、Docker EEを使う必要がある。
(普通にmicrok8sとかでいいじゃんとかはなし :sweat_smile: )

なので、今回は次の手段を利用しよう！！

## [Minikube](https://github.com/kubernetes/minikube)

{{< img name="minikube" size="medium" >}}

MinikubeはKubernetesをローカルマシンで構築するためのツールである。

Minikubeは複数のDriverが利用でき、以下の仮想化機構を使って構築できる。

- virtualbox
- vmwarefusion
- kvm2
- kvm
- hyperkit

これらの仮想化機構を使いVMを作成し、そのVM上にKubernetesを構築する。

今回はVirtualBoxとMinikubeを導入し、Kubernetesを使用できるようにしよう。

# Minikubeの導入

## VirtualBoxのインストール

Minikubeが利用する仮想化環境としてVirtualBoxを使うためインストールしよう。

[VirtualBox](https://www.virtualbox.org/)

上記のサイトからVirtualBoxをダウンロードしインストールする。

## Minikubeのインストール

[Releases · kubernetes/minikube](https://github.com/kubernetes/minikube/releases)

上記のリリースページから対応するOSのバイナリをダウンロードし。

PATHの通っているところに配置する。MacとLinuxは実行権限をつけよう。

# kubectlについて

kubernetesをCLIで操作するためのツール。

基本的にはこのコマンドを通してリソースの作成・変更・削除を行う。

## kubectlのインストール

### Windowsの場合

Powershell Galleryパッケージマネージャーを使ってる場合は以下のコマンドを実行することで導入できる。

```powershell
Install-Script -Name install-kubectl -Scope CurrentUser -Force
install-kubectl.ps1
```

また、Chocolateyというパッケージマネージャーを使っている場合は以下のコマンドで導入できる。

```powershell
choco install kubernetes-cli
```

### Macの場合

brewを使ってインストールしよう。

```sh
brew install kubernetes-cli
```

### Linuxの場合

snapを使用する場合は以下のコマンドで導入する。

```sh
sudo snap install kubectl --classic
```

また、ネイティブのパッケージマネージャー使う場合、Debian系は以下のコマンドを実行。

```sh
sudo apt update && sudo apt install -y apt-transport-https
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
echo "deb https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee -a /etc/apt/sources.list.d/kubernetes.list
sudo apt update
sudo apt install -y kubectl
```

RedHat系はこちら。

```sh
cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://packages.cloud.google.com/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://packages.cloud.google.com/yum/doc/yum-key.gpg https://packages.cloud.google.com/yum/doc/rpm-package-key.gpg
EOF
yum install -y kubectl
```

# Minikubeを使ったKubernetesのローカル環境構築

以下のバージョンで作業を行った。

{{< highlight sh "linenos=False" >}}
 $ minikube version
 minikube version: v0.30.0
 $ kubectl version --client
 Client Version: version.Info{Major:"1", Minor:"12", GitVersion:"v1.12.3", GitCommit:"435f92c719f279a3a67808c80521ea17d5715c66", GitTreeState:"clean", BuildDate:"2018-11-27T01:15:02Z", GoVersion:"go1.11.2", Compiler:"gc", Platform:"darwin/amd64"}
{{< / highlight >}}

構築するのは非常に簡単で `minikube start` を実行するだけだ。

しかし、人によってはVMのリソースを制御したい人がいるかもしれない。その場合は以下のオプションを指定すれば可能だ。

- `--cpus` VMに割り当てるコア数を指定。デフォルトは2
- `--memory` VMに割り当てるメモリ容量を指定。MB単位で指定。デフォルトは2048
- `--disk-size` VMに割り当てるディスクサイズを指定。デフォルトは20g

また、Kubernetesのバージョンを指定したい方は `--kubernetes-version` で指定することが出来る。

以下のような形で指定する。

```sh
minikube start --cpus 4 --memory 4096 --kubernetes-version v1.12.3
```

```sh
$ minikube start --cpus 4 --memory 4096 --kubernetes-version v1.12.3
Starting local Kubernetes v1.12.3 cluster...
Starting VM...
Getting VM IP address...
Moving files into cluster...
Setting up certs...
Connecting to cluster...
Setting up kubeconfig...
Starting cluster components...
Kubectl is now configured to use the cluster.
Loading cached images from config file.
```

コマンドの実行が完了したらローカル環境のKubernetesの構築完了だ。

以下のコマンドを実行してみよう。

```sh
kubectl get nodes
```

```sh
$ kubectl get nodes
NAME       STATUS   ROLES    AGE   VERSION
minikube   Ready    master   5m    v1.12.3
```

上記のようなノードの情報が返ってきたら成功だ！

ついでにMinikubeの環境を停止させるには `minikube stop` を実行、再度起動させる場合は `minikube start` を実行する。


--------------------------------------------------


というわけで今回はここまで。

次回はKubernetesで作成・管理できる最小単位のPodについて見ていき、今回Minikubeで構築したローカル環境を使ってPodを作成してみる。

それでは。

