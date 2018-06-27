---
title: GCEの構築もAnsibleでやろうとした話

date: 2017-01-02T17:22:14+09:00
draft: false

tags:
- python
- ansible

resources:
- name: thumbnail
  src: header.jpg
---

この記事は[Python Advent Calandar 2016](https://qiita.com/advent-calendar/2016/python)の23日目の記事です。(大遅刻その2)

# やろうとしたこと

要は、GCEでインスタンスの起動からプロビジョニングまでを自動でやってくれる+他のGCPの様々な設定も自動化する

というところで、AnsibleにGoogle Cloudのモジュールがあるのを知り、試してみた次第です。

先に落ちを言っておくと諦めましたｗ


# gce_netモジュールを使ってみる

GCEのインスタンスを置くネットワークとファイアウォールを作成してみる。

```yaml
--- # tasks/main.yml
- name: Load Network Vars
  include_vars: "sandbox.yml"

- name: Create Network
  local_action:
    module: gce_net
    name: "{{ item.name }}"
    mode: "{{ item.mode }}"
    subnet_name: "{{ item.subnet_name }}"
    subnet_region: "{{ item.subnet_region }}"
    ipv4_range: "{{ item.ipv4_range }}"
  with_items: "{{ network }}"

- name: Create Firewall Rules
  local_action:
    module: gce_net
    name: "{{ item.name }}"
    fwname: "{{ item.fwname }}"
    src_range: "{{ item.src_range }}"
    allowed: "{{ item.allowed }}"
    target_tags: "{{ item.target_tags | default([]) }}"
  with_items: "{{ firewall_rule }}"
  ignore_errors: yes

--- # vars/sandbox.yml
network:
  - name: sandbox-network
    mode: custom
    subnet_name: sandbox-webserver
    subnet_region: asia-northeast1
    ipv4_range: "172.26.0.0/16"

firewall_rule:
  - name: sandbox-network
    fwname: sandbox-network-allow-internal
    src_range: "172.26.0.0/16"
    allowed: "tcp;udp;icmp"

  - name: sandbox-network
    fwname: sandbox-network-allow-http
    src_range: "0.0.0.0/0"
    allowed: tcp:80
    target_tags: [http-server]

  - name: sandbox-network
    fwname: sandbox-network-allow-https
    src_range: "0.0.0.0/0"
    allowed: tcp:443
    target_tags: [https-server]

  - name: sandbox-network
    fwname: sandbox-network-allow-ssh
    src_range: "0.0.0.0/0"
    allowed: tcp:22
    target_tags: [ssh-server]
```

なんか、変数定義のあり方とかまだまだな感じですが、要はvarsに定義したネットワークとルールを作成する感じ。

`Create Firewall Rules`の部分で`ignore_errors`をyesにしているのは何故か`tcp;udp;icmp`のルールの部分で
1回目はchangedになるのだが、2回目流したときにokにならずfailedになってしまう。他のルールはokになるんだけど、なんでだろうか。。

1回目は正しく作成されるので一旦`ignore_errors`で避けることに。。


# gceモジュールを使ってみる

さっき作ったネットワークにインスタンスを作成してみる。

```yaml
--- # tasks/main.yml
- name: Load Instance Vars
  include_vars: "sandbox.yml"

- name: Create Boot Disks
  local_action:
    module: gce_pd
    name: "{{ item.1 }}"
    image: "{{ item.0.boot_disk.image }}"
    disk_type: "{{ item.0.boot_disk.disk_type }}"
    size_gb: "{{ item.0.boot_disk.size_gb }}"
    zone: "{{ item.0.zone }}"
    state: present
  with_subelements:
    - "{{ instance }}"
    - instance_name

- name: Create Instance
  local_action:
    module: c_gce
    instance_names: "{{ item.1 }}"
    zone: "{{ item.0.zone }}"
    machine_type: "{{ item.0.machine_type }}"
    state: present
    metadata: "{{ item.0.metadata | default({}) }}"
    tags: "{{ item.0.tags | default([]) }}"
    disks: |
      {% set o = item.0.disks if item.0.disks is defined else [] %}
      {% set _ = o.insert(0, {'name': item.1, 'mode': 'READ_WRITE'}) %}
      {{ o }}
    disk_auto_delete: "{{ item.0.disk_auto_delete | default(true) }}"
    external_ip: ["104.198.124.92"]
    network: "{{ item.0.network }}"
    subnetwork: "{{ item.0.subnetwork }}"
    preemptible: "{{ item.0.preemptible | default(false) }}"
    ip_forward: "{{ item.0.ip_forward | default(false) }}"
    service_account_permissions: "{{ item.0.service_account_permissions | default([]) }}"
  with_subelements:
    - "{{ instance }}"
    - instance_name

--- # vars/sandbox.yml
instance:
  - instance_name:
      - sb-01
    zone: asia-northeast1-a
    machine_type: n1-standard-1
    tags: 
      - test
    boot_disk:
      size_gb: 10
      image: centos-7
      disk_type: pd-ssd
    external_ip:
      - test
    network: sandbox-network
    subnetwork: sandbox-webserver
```

長いですが、要はvarsで定義した設定でインスタンスを上げるだけです。

ここで面倒なのが2点。

- ブートディスクをカスタマイズする場合は先にディスクを作っておく必要がある
- インスタンス作成時にブートディスクを指定する場合は`disks`の1つ目に指定する必要がある

この2点のために最初にディスク作成と、`disks`でゴニョゴニョやっています。

で、ここで解決できない問題に当たってしまいました。
Private IPを指定することができない・・・。

gceモジュールのソースを見てみたところ、apache-libcloudというライブラリをラップしているようなモジュールでした。
そのライブラリでインスタンスを作成する際にPrivate IPが指定できるようになっていないためgceモジュールを改造することもできず・・。

ここでAnsibleでGCE系の構築を諦めることにしました(´・ω・｀)

# 最後に

結局Webなどでもよく見かける

- Terraform
- Packer
- Ansible

の3つを上手く組み合わせて使用する方法になりそうです。Hashcorpすごいですね、便利。

それとなんでAWS系のモジュールはboto(AWSの公式ライブラリ)使ってるのになんでGCPはlibcloud使ったんだろうか・・。
libcloudでGCPの細かなところも設定できるなら良いかなとか思うのですが、設定できなかったり融通きかない点がいくつかって辛い。

これを機会にGCP用のAnsibleモジュールを書いてみようかなと思います。

