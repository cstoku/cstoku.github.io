---
title: Kubernetes道場 18日目 - Affinity / Anti-Affinity / Taint / Tolerationについて

date: 2018-12-18T00:00:00+09:00

tags:
- kubernetes
- advent-calendar-2018
- kubernetes-dojo

resources:
- name: thumbnail
  src: header.jpg

---

この記事は [Kubernetes道場 Advent Calendar 2018](https://qiita.com/advent-calendar/2018/k8s-dojo) 18日目の記事です。

今回はAffinity / Anti-Affinity / Taint / Tolerationについて。

# Affinity / Anti-Affinity

AffinityはPodのスケジュールについての条件を指定をする機能だ。Affinityについては以下の3つの種類がある。

- Node Affinity
- Pod Affinity
- Pod Anti-Affinity

一つずつ見ていこう。

## Node Affinity

Node AffinityはNodeにあるLabelを元にPodのスケジュールを行う。
前回にこの機能に近い `nodeSelector` があったが、これよりも柔軟な指定をすることができる。

条件の指定方法には2種類あり、

- `matchExpressions` : NodeのLabelに対して集合ベースの比較
- `matchFields` : Nodeオブジェクトのフィールドに対して集合ベースの比較

`matchExpressions` については以前と同様の指定で行えるので割愛するが、 `matchFields` については初めて扱うので少し見ていこう。

### matchFields

`matchFields` はオブジェクトのフィールドに対して集合ベースの比較を行う。

フィールドについては `matchExpressions` と同様のものだが、 `key` にはオブジェクトのフィールド名を指定する。

以下が指定例だ。

```yaml
key: metadata.name
operator: In
values:
- hoge
- fuga
```

この `matchFields` をサポートしているフィールドはオブジェクトによって異なる。
`metadata.name` と `metadata.namespace` は全てのオブジェクトでサポートされている。

サポートされていないフィールドを `key` に指定するとエラーとなる。

## Pod Affinity / Anti-Affinity

Pod AffinityとPod Anti-Affinityは既にスケジュールされているPodのラベルを元に、自身のスケジュールを行う。

Pod Affinityは条件にマッチした場合はスケジュールされ、Pod Anti-Affinityは条件にマッチした場合はスケジュール対象から除外される。

条件の指定方法は以下の3つのフィールドを使って行う。

- `labelSelector` : PodのLabelに対してのLabelSelectorを指定する。 `matchLabels` と `matchExpressions` が指定可能だ。
- `namespaces` : LabelSelectorの対象にするNamespaceをリストで指定する。指定しなかったり空リストにした場合、現在スケジュールしようとしているPodのNamespaceが対象になる。
- `topologyKey` : NodeのLabelのKeyを指定する。このフィールドは必須である。

さて、 `labelSelector` と `namespaces` についてはつかめると思うが、 `topologyKey` が難しいところだ。詳しく見ていこう。

### Topology Key



### Pod Affinity / Anti-Affinityのスケジュールの詳細



## 条件の必須要件と推奨要件




## Affinity / Anti-Affinityの例




#  Taint / Toleration


--------------------------------------------------


というわけで今回はここまで。

次回はAuthn / Authz / ServiceAccountについて見ていこう。

それでは。

