---
title: BPFについて調べてみた

date: 2018-12-09T00:00:00+09:00

tags:
- bpf
- ebpf

resources:
- name: thumbnail
  src: header.jpg
- name: envoy-sidecar
  src: envoy-sidecar.jpg
- name: envoy-iptables
  src: envoy-iptables.jpg
- name: bpf-overview
  src: bpf-overview.jpg
- name: bpf-instset
  src: bpf-instset.jpg
- name: bcc-tools
  src: bcc-tools.jpg

---

この記事は [CyberAgent Developers Advent Calendar 2018](https://adventar.org/calendars/2951) 9日目の記事です。

今回はBPFについてちょっと調べてみた。それのまとめ。落ちはない。

# なぜBPFを調べようと思ったのか

要はBPFを調べようと思った動機をちょっと。

唐突にはなってしまうが、Kubernetesの上に乗っかるService Meshに関するミドルウェア(Istio/Envoyあたり)などでネットワークのレイテンシが問題として話に出ることがそこそこある。

基本的にService MeshのツールはコンテナのSidecarとして動作させ、Networkの通信をすべて見えるようにiptablesで自身にルーティングさせて、Proxyするように動作する。

これの解説としてよく見るのは以下のような図だ。

{{< img name="envoy-sidecar" >}}

これ始めてみたときに個人的にはゾッとしたが(latency大丈夫なのか的な。)、実際には以下のような通信をしている。

{{< img name="envoy-iptables" >}}

こんなの嫌だ(雑)。(KubernetesのServiceも通常iptablesを使っていますが・・。)

この辺りの通信の処理がどうにかならないかな・・・、と考えていたところ[Cilium](https://cilium.io/)というプロジェクトがBPFという技術を使っていてこの問題を解決しようとしているらしい、というのをKubeCon EU 2018で知った。

そういう経緯があってBPFを調べようと思ったわけだ。ちょっと長かったがここまでが経緯。

しかも、先にここに書いておくがこの経緯はBPFの解釈に結構誤解を与える経緯だった :innocent:

(実際、この問題を解決するアプローチの技術は [eBPF + XDP](https://cilium.readthedocs.io/en/stable/bpf/) だった)

さて本題に入る。

# BPFとは

Berkeley Packet Filter。パケットを効率よくフィルタリングする機構だ。

BPFはBSD系では `/dev/bpf*` というデファイすを使って利用することができる。また、Linuxでは [LSF(Linux Socket Filtering)](https://www.kernel.org/doc/Documentation/networking/filter.txt) という機構を使ってBPFを利用できる。

BPFの概要は以下のような構成になっている。[^1]

{{< img name="bpf-overview" >}}

図のようにネットワークからパケットが送られきて、ドライバが処理した後BPFの機構に送られる。BPFはアタッチされたフィルタリングプログラムを元にパケットをフィルタリングし、バッファに貯める。通常の方法との違う点は、BPFはフィルタリング処理をカーネル空間上でやるところにある。

BPFはカーネル内で処理される仮想的なレジスタマシンで実行される。BPFを利用するにはこのレジスタマシンで実行できるフィルタリングプログラムを記述し、アタッチすることでフィルタリングが行われる。

BPFのレジスタマシンの命令セットは以下のものがある。[^1]

{{< img name="bpf-instset" size="medium" >}}

## BPFを使っているツール

BPFを使っている代表的なツールでtcpdumpがある。

実はtcpdumpのオプションで `-d` を使用するとBPFのプログラムが出力される。また、dの数を増やすと機械語まで落としてくれる。

```plain
$ tcpdump -d icmp
(000) ldh      [12]
(001) jeq      #0x800           jt 2    jf 5
(002) ldb      [23]
(003) jeq      #0x1             jt 4    jf 5
(004) ret      #262144
(005) ret      #0
$ tcpdump -dd icmp
{ 0x28, 0, 0, 0x0000000c },
{ 0x15, 0, 3, 0x00000800 },
{ 0x30, 0, 0, 0x00000017 },
{ 0x15, 0, 1, 0x00000001 },
{ 0x6, 0, 0, 0x00040000 },
{ 0x6, 0, 0, 0x00000000 },
$ tcpdump -ddd icmp
6
40 0 0 12
21 0 3 2048
48 0 0 23
21 0 1 1
6 0 0 262144
6 0 0 0
```

この機能はtcpdumpが利用しているlibpcapで実装されており、libpcapがパケットのフィルタリングにBPFを利用している。

また、BPFを使ったダイナミックトレーシングツール群の [bcc](https://iovisor.github.io/bcc/) がある。

{{< img name="bcc-tools" >}}

このbccはPythonのライブラリとして提供されており、Pythonから簡単にBPFが利用できる。

# BPFとeBPF

BPFはパケットのフィルタリングだけじゃなく、別の用途にでも扱えるのでは。という乱用まつりが始まる。これに合わせてBPFのレジスタマシンも拡張された。

eBPFではパケットのフィルタリング以外にもシステムコールのフィルタリングやなども行える。

[linux/bpf.h at master torvalds/linux](https://github.com/torvalds/linux/blob/master/include/uapi/linux/bpf.h#L136)

既存のBPFはclassic BPF(cBPF)、拡張されたBPFをextended BPFやinternal BPFと呼ばれる。

internal BPFのネーミング由来は、cBPFを実行する際は内部でeBPFのプログラムに変換されて実行される。要はcBPFから見た内部で実行されるinternal BPFがeBPFだ、いう経緯だと思っている。(ソース知っている方教えていただけると幸いです)

# 今後

要は本来調べたかったCiliumで使われている技術はeBPFで、BPFはその過去の実装だったわけだ。歴史の勉強をしていた気分。。

だが、経緯などを知れてeBPFの理解が深まるかなと思っている。

今後はeBPFについての各フィルタやその実装方法について追っていきたいと考えている。最終的にはXDPについても調査していきたい所存。

それでは。


[^1]: [The BSD Packet Filter: A New Architecture for User-level Packet Capture](https://www.tcpdump.org/papers/bpf-usenix93.pdf)

