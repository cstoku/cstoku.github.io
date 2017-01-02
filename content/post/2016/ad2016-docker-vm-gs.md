+++
title = "VMからDockerに乗り換えてみたらどうでしょう？"
date = "2016-12-25T20:54:45+09:00"
description = "VMからDockerのコンテナに置き替えた際の操作方法の解説"
image = "header.png"
tags = [
  "docker",
  "docker-compose",
]
draft = false
categories = [
  "docker",
]

+++

この記事は[Docker Advent Calandar 2016](http://qiita.com/advent-calendar/2016/docker)の22日目の記事です。(大遅刻)


# 前置き的な

Dockerも結構安定してきた(気がする)ので、そろそろVMで頑張っている人もDockerに乗り換えてみたらどうでしょう？
という提案みたいなものです。

その際に対応するコマンドなどのまとめなどを書いていこうと思います。


# VMの代わりにDockerをつけてみる(コンテナの作成)

ManagerでVMを作成したり、`vagrant up`などやっていると思いますが、Dockerでは`docker run`コマンドを使用します。

```sh
docker run -d --privileged --name my-vm ubuntu /sbin/init
```

軽くオプションの説明をしておくと、

- `-d`: バックグラウンドで動作
- `--privileged`: 特権モードで起動(今回掘り下げません)
- `--name`: 名前を設定

てな感じです。

`ubuntu`の位置を別のOS名にすることができます。
また、`ubuntu:14.4`や`centos:6`のようにコロンの後にバージョンの指定をすることができます。

`/sbin/init`の部分については今回掘り下げません。詳しく知りたい場合は、initプロセスなどでググってみるといいと思います。

## ポートマッピング

一つ注意しなければならないのが、コンテナ上のサーバーなどにアクセスしたい場合、ポートを`docker run`コマンドの
`-p`オプションを用いて指定しておく必要があります。

```sh
docker run -d --privileged -p 8080:80 --name my-vm ubuntu /sbin/init
```

`-p`オプションのコロンの前がホストマシンのポート、コロンの後がコンテナのポートになります。

公開するポートは複数指定することも可能です。

```sh
docker run -d --privileged -p 16379:6379 -p 16380:6380 -p 10080:80 --name my-vm ubuntu /sbin/init
```

# SSH的なことをしてみる(コンテナ上にプロセスを起動)

VMにSSHしてゴニョゴニョ、はよくやりますよね。DockerでSSHをすることはできないことはないですが、大体の場合SSHする目的は
対象のマシン上でbashなりのシェルを起動してコマンドを実行する、ということだと思います。

Dockerでは起動したいシェルをコンテナ上に起動する、というシンプルな方法で実現できます。

例ではmy-vmという名前のコンテナを作成・実行したのでこのコンテナでbashをつけてみます。

```sh
docker exec -it my-vm bash
```

オプションの説明です。

- `-it`: `-i`オプションと`-t`オプションを同時に指定
- `-i`: 標準入力をオープンする
- `-t`: 疑似ttyを割り当て

普段使用しているプロンプトから違うものに変わったと思います。この時点で「VM上にSSH」みたいなことができています。
後は普段通り、開発などなどしてみましょう！！

終了する場合は普通に`exit`すればいいです。


# VMの停止/起動/再起動をしてみる(コンテナの停止/起動/再起動)

これらのコマンドはシンプルです。
各処理をmy-vmコンテナにやってみます。

## VMの停止(コンテナの停止)

```sh
docker stop my-vm
```


## VMの起動(コンテナの起動)

```sh
docker start my-vm
```

## VMの再起動(コンテナの再起動)

```sh
docker restart my-vm
```


# おまけ

`docker run`コマンドが長ったらしい・・・。と思う人がいる、と思いますｗ

そんな時には`docker-compose`コマンド。yamlファイルから設定を読み込んでコンテナを作成/起動/停止などの操作が可能です。

コマンドのオプションを何度もいじる事があれば、docker-composeで設定ファイルを書換えるほうがよかったり？
とか思ったりするので試してみてはどうでしょうか？

今回作成したmy-vmコンテの設定を`docker-compose`の設定ファイルにしてみます。

```yaml
version: '2'

services:
  my_vm:
    image: ubuntu
    command: /sbin/init
    privileged: true
    container_name: my-vm
    ports:
        - "16379:6379 "
        - "16380:6380"
        - "10080:80"
```

このファイルを`docker-compose.yml`というファイル名で保存して、対応する操作を行います。

### 作成/起動

```sh
docker-compose up -d
```

### 停止

```sh
docker-compose stop
```

### 起動

```sh
docker-compose start
```

### 再起動

```sh
docker-compose restart
```


# まとめ

VMでやっていることをDockerにとりあえず置き替えてみる。という内容で書いてみました。

正直、Dockerの思想とは違うものではありますが、Dockerをとりあえず導入してみたい、という糧の1つになればと思います！
