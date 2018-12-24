---
title: Kubernetes道場 20日目 - Role / RoleBinding / ClusterRole / ClusterRoleBindingについて

date: 2018-12-20T00:00:00+09:00

tags:
- kubernetes
- advent-calendar-2018
- kubernetes-dojo

resources:
- name: thumbnail
  src: header.jpg

---

この記事は [Kubernetes道場 Advent Calendar 2018](https://qiita.com/advent-calendar/2018/k8s-dojo) 20日目の記事です。

今回はRole / RoleBinding / ClusterRole / ClusterRoleBindingについて。

そのまえに、これらのオブジェクトを使うRBACについて再度少し見ていこう。

# RBACについて

RBACはロールベースのアクセス制御だ。

RBACは権限を表すルールを指定するRoleとRoleとユーザーやグループを紐付けるRoleBingingを作成し、アクセス制御を行う。
タイトルにもあるが、RBACに関するリソースは4つある。

- Role
- ClusterRole
- RoleBinding
- ClusterRoleBinding

それぞれ見ていこう。

## Role / ClusterRole

Role / ClusterRoleは権限を表すルールを指定し、ロールを作成する。

RoleとClusterRoleの違いはNamespaceで分離されているかの違いだ。RoleはNamespaceで分離されている。ClusterRoleはNamespaceで分離されておらず、クラスター全体から参照できる。

むしろRoleとClusterRole間で、それ以外の違いは特に無い。

さて、それではRole / ClusterRoleのフィールドについて見ていこう。

### Role / ClusterRoleのフィールド

Role / ClusterRoleは `rules` にリストでルールを記述する。ではルールについてのフィールドを見ていく。

- `apiGroups` : リソースが含まれているAPIのグループの名前をリストで指定
- `resources` : このルールを適用するリソースをリストで指定する。 `ResourceAll` は全てのリソースを示す。
- `resourceNames` : このルールを適用するリソースの名前をリストで指定する。このフィールドの指定は任意だ。
- `verbs` : このルールで指定したリソースに対する操作をリストで指定する。 `VerbAll` は全ての操作を示す。
- `nonResourceURLs` : アクセスに必要なURLをリストで指定する。このフィールドはClusterRoleのみで指定できる。

Roleの指定例は以下の通りだ。

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: test-role
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
```

また、ClusterRoleでは `aggregationRule` フィールドがあり、LabelSelectorをリストで指定するフィールドがある。このLabelSelectorで選択したClusterRoleをまとめたClusterRoleを作成できる。

## RoleBinding / ClusterRoleBinding

RoleBinding / ClusterRoleBindingはRoleとユーザーやグループを紐付けるリソースだ。

RoleBindingとClusterRoleBindingの違いはRoleとClusterRoleの違いと同様でNamespaceの分離の有無だ。

それではRoleBinding / ClusterRoleBindingのフィールドについて見ていこう。

### RoleBinding / ClusterRoleBindingのフィールド

RoleBinding / ClusterRoleBindingは2つのフィールドがある。

- `roleRef` : ロールを指定する。
- `subjects` : ユーザーやグループ、ServiceAccountをリストで指定する。

2つのフィールドを詳しく見ていこう。

#### RoleBinding / ClusterRoleBindingのフィールドの詳細

##### roleRef

このフィールドでロールを指定する。指定できるフィールドは以下の通りだ。

- `apiGroup` : リソースのグループを指定。基本的にこのフィールドの値は `rbac.authorization.k8s.io` になる。
- `kind` : オブジェクト名を指定する。ここでは `Role` か `ClusterRole` になる。
- `name` : リソース名を指定する。基本的にこのフィールドの値はロール名になる。

roleRefの指定例は以下の通りだ。

```
apiGroup: rbac.authorization.k8s.io
kind: Role
name: test-role
```

##### subjects

このフィールドでロールを紐付けるユーザやグループ、ServiceAccountを指定する。指定できるフィールドは以下の通りだ。

- `apiGroup` : リソースのグループを指定。通常ServiceAccountの場合空文字でユーザーやグループの場合 `rbac.authorization.k8s.io` になる。
- `kind` : オブジェクト名を指定する。ここでは `User` / `Group` / `ServiceAccount` のどれかになる。
- `name` : リソース名を指定する。ここではユーザー名 / グループ名 / サービスアカウント名のどれかになる。
- `namespace` : 対象リソースのNamespaceを指定する。 `kind` で `User` か `Group` を指定している場合、空文字にしないとエラーになる。

subjectsの指定例は以下の通りだ。

```
apiGroup: ""
kind: ServiceAccount
name: test-sa
namespace: default
```

#### RoleBindingの指定例

RoleBindingの指定例は以下の通りだ。

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: test-rolebinding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: test-role
subjects:
- apiGroup: ""
  kind: ServiceAccount
  name: test-sa
  namespace: default
```

# Role / RoleBinding を使ってみる

今回はRoleとRoleBindingを使ってみる。
ClusterRoleやClusterRoleBindingもほぼ同じ方法で扱えるため今回は省略させてもらう。

さて、まず認証を別にするためServiceAccountを作成しよう。

```plain
$ kubectl create sa test-sa
serviceaccount/test-sa created
$ kubectl get sa/test-sa
NAME      SECRETS   AGE
test-sa   1         3h2m
```

さて、このアカウントで認証されるように設定を追加する。まず作成したServiceAccountのTokenを知るため、紐付いているSecretをyaml形式で取得し、確認する。

```plain
$ kubectl get sa/test-sa -o yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  creationTimestamp: "2018-12-24T14:30:48Z"
  name: test-sa
  namespace: default
  resourceVersion: "86877"
  selfLink: /api/v1/namespaces/default/serviceaccounts/test-sa
  uid: 8200b4a5-0788-11e9-94ed-9e6340a852c2
secrets:
- name: test-sa-token-hfv65
```

上の表示では `test-sa-token-hfv65` と出てきた。この表示されたSecretをyaml形式で取得し、Tokenを確認する。

```plain
$ kubectl get secret/test-sa-token-hfv65 -o yaml
apiVersion: v1
data:
  ca.crt: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUMrekNDQWVPZ0F3SUJBZ0lKQVBQTnpIZkdaNy9DTUEwR0NTcUdTSWIzRFFFQkN3VUFNQlF4RWpBUUJnTlYKQkFNTUNURXlOeTR3TGpBdU1UQWVGdzB4T0RFeU1UUXhPRE0wTVRGYUZ3MDBOakExTURFeE9ETTBNVEZhTUJReApFakFRQmdOVkJBTU1DVEV5Tnk0d0xqQXVNVENDQVNJd0RRWUpLb1pJaHZjTkFRRUJCUUFEZ2dFUEFEQ0NBUW9DCmdnRUJBTU1pbEFPSTFUd01zc0lDQ2xzVnNFVkNEU2NZcHo0ajBoZE1Ubzg5WU5tclNDZHBIL01pcjFQK2NwbzEKZHpXUlRjaDNudnZwc1VOR1lyRXJMTmpIUVlDbGh3WFdSYmZ5a0pCV0NoR3p6T0RPbEtkSkc3RDFsc0NoNzNxdQpPeEYzKzEwVlJNRUY4R05XeWdDSEJINzlHS0V0VnMyWEhPSHkwSmRxTG92a00wbjkxeWIwZ25nUThMeEhwYVJCCkloNGdkL2pLeHk4UDd5ME0xcm9BenIvb2lwbGhzMTFjQkI2cFVzVXA2WUU2VjVuQ2htOXVOQTRDaWdlQTRTSjUKNjkzcFI0NThyNUFOeXVFdzZrSzFiNzdkL000aG1PUDByVHdvRFFQa0dJN2FTZHhMZzR6T2hzRU9LSURLT21VWQppYi9rbHFEdWZwNVlETENpUEhmN1RHV3BlS2NDQXdFQUFhTlFNRTR3SFFZRFZSME9CQllFRlBNd2M3R0YxKzhCCk94N1gvR2wwaG5XL0FaUERNQjhHQTFVZEl3UVlNQmFBRlBNd2M3R0YxKzhCT3g3WC9HbDBoblcvQVpQRE1Bd0cKQTFVZEV3UUZNQU1CQWY4d0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFBZjF6THR5ZkhVWkZYWE13Skc0OHJFcwpqQTUrYkZLSFNmUmRtOXdkKzBPd3ljeGVLK1NuY3Z2N3NJd0g5cU5GbVVZdUxvMUpVMmZ1L3NtS1ZGc0RNNkNjClpFQTFmK0xCdDVkMEI3NTNoTWJRVDZzOUdPR3BSbWhnK0NLdnZEV1oyT1ZwcG40YWRka0lMNHEwVi94cWNxa20KdGVMNkZOd015YnpBWWZqTlNuZXc4VnMyQ2ZHa0ZGTmlwYXBuaWg4M21SRFpLelV3YVJ2bjYzc2pFOHc4b1doegpNUUZQY2tnQlkvZGt1N0pqTnN4b0Y1dE1tWUFPYkRDQnhVUFc2SVUvc0k4UElVMG1qREdYeVZ0NVN4TFNzbjJMCjA4QVpXQ2YxL2pNbWYzM25JT2xqLzFITHMycEplTGhKY1ZWR0k0MUNZVnY2bTlubk1XcUVYSlZBSXAyNlRwST0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=
  namespace: ZGVmYXVsdA==
  token: ZXlKaGJHY2lPaUpTVXpJMU5pSXNJbXRwWkNJNklpSjkuZXlKcGMzTWlPaUpyZFdKbGNtNWxkR1Z6TDNObGNuWnBZMlZoWTJOdmRXNTBJaXdpYTNWaVpYSnVaWFJsY3k1cGJ5OXpaWEoyYVdObFlXTmpiM1Z1ZEM5dVlXMWxjM0JoWTJVaU9pSmtaV1poZFd4MElpd2lhM1ZpWlhKdVpYUmxjeTVwYnk5elpYSjJhV05sWVdOamIzVnVkQzl6WldOeVpYUXVibUZ0WlNJNkluUmxjM1F0YzJFdGRHOXJaVzR0YUdaMk5qVWlMQ0pyZFdKbGNtNWxkR1Z6TG1sdkwzTmxjblpwWTJWaFkyTnZkVzUwTDNObGNuWnBZMlV0WVdOamIzVnVkQzV1WVcxbElqb2lkR1Z6ZEMxellTSXNJbXQxWW1WeWJtVjBaWE11YVc4dmMyVnlkbWxqWldGalkyOTFiblF2YzJWeWRtbGpaUzFoWTJOdmRXNTBMblZwWkNJNklqZ3lNREJpTkdFMUxUQTNPRGd0TVRGbE9TMDVOR1ZrTFRsbE5qTTBNR0U0TlRKak1pSXNJbk4xWWlJNkluTjVjM1JsYlRwelpYSjJhV05sWVdOamIzVnVkRHBrWldaaGRXeDBPblJsYzNRdGMyRWlmUS5Sd1NzRFp5bVlyVTZPcjl3NWtyZXR1eUJURHV3a2hvTXBVODVDM2M1TzVCekt6VklDTWg3TFhhUzVlQWxyb1N1dXY0UHV0NUtBRExkWWdQX2NqVmFlN3kxSzV4ZXU4STRJWkp1MHBMd2czUVJoNENOcDZfWDFqZ3RqdmQzVXd2QVloODZWaG5PcnJ6Y0N3SW9oTzEyVjBhT3FzS1JuNEM1RlE4aXQwVHhMekhNQ0NMc3VFSHBHV2NKS3cxRGZyelZwUnMtS0pmeWRVem1YdlBieDRPTmpVaWo3d3RmbmZnR3JBNUtINkota1c3akZwT1RFM0UzaTBnckVCZGZpaGY5ZTFwd3ItcEx6S2J0MEN4UlAxSnlvYjF5b2N6YjN5djFBVmVuY1lacGlWWnFGQTE0a01pdVBjNUZGekktU0QzVFgya2IybFJDeGJGZTliV3VHeFVDUFE=
kind: Secret
metadata:
  annotations:
    kubernetes.io/service-account.name: test-sa
    kubernetes.io/service-account.uid: 8200b4a5-0788-11e9-94ed-9e6340a852c2
  creationTimestamp: "2018-12-24T14:30:49Z"
  name: test-sa-token-hfv65
  namespace: default
  resourceVersion: "86876"
  selfLink: /api/v1/namespaces/default/secrets/test-sa-token-hfv65
  uid: 8207f1df-0788-11e9-94ed-9e6340a852c2
type: kubernetes.io/service-account-token
```

さて、Tokenが確認できた。しかし以前解説したとおり、SecretのValueはBase64でエンコードされているため、デコードしよう。

```plain
$ echo -n 'ZXlKaGJHY2lPaUpTVXpJMU5pSXNJbXRwWkNJNklpSjkuZXlKcGMzTWlPaUpyZFdKbGNtNWxkR1Z6TDNObGNuWnBZMlZoWTJOdmRXNTBJaXdpYTNWaVpYSnVaWFJsY3k1cGJ5OXpaWEoyYVdObFlXTmpiM1Z1ZEM5dVlXMWxjM0JoWTJVaU9pSmtaV1poZFd4MElpd2lhM1ZpWlhKdVpYUmxjeTVwYnk5elpYSjJhV05sWVdOamIzVnVkQzl6WldOeVpYUXVibUZ0WlNJNkluUmxjM1F0YzJFdGRHOXJaVzR0YUdaMk5qVWlMQ0pyZFdKbGNtNWxkR1Z6TG1sdkwzTmxjblpwWTJWaFkyTnZkVzUwTDNObGNuWnBZMlV0WVdOamIzVnVkQzV1WVcxbElqb2lkR1Z6ZEMxellTSXNJbXQxWW1WeWJtVjBaWE11YVc4dmMyVnlkbWxqWldGalkyOTFiblF2YzJWeWRtbGpaUzFoWTJOdmRXNTBMblZwWkNJNklqZ3lNREJpTkdFMUxUQTNPRGd0TVRGbE9TMDVOR1ZrTFRsbE5qTTBNR0U0TlRKak1pSXNJbk4xWWlJNkluTjVjM1JsYlRwelpYSjJhV05sWVdOamIzVnVkRHBrWldaaGRXeDBPblJsYzNRdGMyRWlmUS5Sd1NzRFp5bVlyVTZPcjl3NWtyZXR1eUJURHV3a2hvTXBVODVDM2M1TzVCekt6VklDTWg3TFhhUzVlQWxyb1N1dXY0UHV0NUtBRExkWWdQX2NqVmFlN3kxSzV4ZXU4STRJWkp1MHBMd2czUVJoNENOcDZfWDFqZ3RqdmQzVXd2QVloODZWaG5PcnJ6Y0N3SW9oTzEyVjBhT3FzS1JuNEM1RlE4aXQwVHhMekhNQ0NMc3VFSHBHV2NKS3cxRGZyelZwUnMtS0pmeWRVem1YdlBieDRPTmpVaWo3d3RmbmZnR3JBNUtINkota1c3akZwT1RFM0UzaTBnckVCZGZpaGY5ZTFwd3ItcEx6S2J0MEN4UlAxSnlvYjF5b2N6YjN5djFBVmVuY1lacGlWWnFGQTE0a01pdVBjNUZGekktU0QzVFgya2IybFJDeGJGZTliV3VHeFVDUFE=' | base64 -d
eyJhbGciOiJSUzI1NiIsImtpZCI6IiJ9.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJkZWZhdWx0Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6InRlc3Qtc2EtdG9rZW4taGZ2NjUiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoidGVzdC1zYSIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VydmljZS1hY2NvdW50LnVpZCI6IjgyMDBiNGE1LTA3ODgtMTFlOS05NGVkLTllNjM0MGE4NTJjMiIsInN1YiI6InN5c3RlbTpzZXJ2aWNlYWNjb3VudDpkZWZhdWx0OnRlc3Qtc2EifQ.RwSsDZymYrU6Or9w5kretuyBTDuwkhoMpU85C3c5O5BzKzVICMh7LXaS5eAlroSuuv4Put5KADLdYgP_cjVae7y1K5xeu8I4IZJu0pLwg3QRh4CNp6_X1jgtjvd3UwvAYh86VhnOrrzcCwIohO12V0aOqsKRn4C5FQ8it0TxLzHMCCLsuEHpGWcJKw1DfrzVpRs-KJfydUzmXvPbx4ONjUij7wtfnfgGrA5KH6J-kW7jFpOTE3E3i0grEBdfihf9e1pwr-pLzKbt0CxRP1Jyob1yoczb3yv1AVencYZpiVZqFA14kMiuPc5FFzI-SD3TX2kb2lRCxbFe9bWuGxUCPQ
```

生のTokenが確認できた。これをCredentialとしてConfigにセットしよう。 `kubectl config set-credentials` で行う。

```plain
$ kubectl config set-credentials test-sa --token 'eyJhbGciOiJSUzI1NiIsImtpZCI6IiJ9.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJkZWZhdWx0Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6InRlc3Qtc2EtdG9rZW4taGZ2NjUiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoidGVzdC1zYSIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VydmljZS1hY2NvdW50LnVpZCI6IjgyMDBiNGE1LTA3ODgtMTFlOS05NGVkLTllNjM0MGE4NTJjMiIsInN1YiI6InN5c3RlbTpzZXJ2aWNlYWNjb3VudDpkZWZhdWx0OnRlc3Qtc2EifQ.RwSsDZymYrU6Or9w5kretuyBTDuwkhoMpU85C3c5O5BzKzVICMh7LXaS5eAlroSuuv4Put5KADLdYgP_cjVae7y1K5xeu8I4IZJu0pLwg3QRh4CNp6_X1jgtjvd3UwvAYh86VhnOrrzcCwIohO12V0aOqsKRn4C5FQ8it0TxLzHMCCLsuEHpGWcJKw1DfrzVpRs-KJfydUzmXvPbx4ONjUij7wtfnfgGrA5KH6J-kW7jFpOTE3E3i0grEBdfihf9e1pwr-pLzKbt0CxRP1Jyob1yoczb3yv1AVencYZpiVZqFA14kMiuPc5FFzI-SD3TX2kb2lRCxbFe9bWuGxUCPQ'
User "test-sa" set.
```

さて、このCredentialを使用するContextを作成する。 `kubectl config set-context` で行う。

```plain
$ kubectl config set-context test-sa-context --user test-sa --cluster minikube
Context "test-sa-context" created.
```

それではこのContextを利用するように設定しよう。

```plain
$ kubectl config use-context test-sa-context
Switched to context "test-sa-context".
```

それではこのCredentialを使ってPodを取得してみよう。

```plain
$ kubectl get po
Error from server (Forbidden): pods is forbidden: User "system:serviceaccount:default:test-sa" cannot list resource "pods" in API group "" in the namespace "default"
```

認証はできているが、 `Forbidden` といわれ許可されなかったことがわかる。

それではこのアカウントにPodの取得ができるようにRoleとRoleBindingを作成しよう。

まず、権限があるContextに切り替えよう。

```plain
$ kubectl config use-context minikube
Switched to context "minikube".
```

では、まずPodが取得できるようなRoleを作成する。以下のようなManifestを作成した。

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: test-role
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
```

(実は上で上げた例のままだ :sweat_smile:)

それでは上のManifestを適用し、確認しよう。

```plain
$ kubectl apply -f test-role.yaml
role.rbac.authorization.k8s.io/test-role created
$ kubectl get -f test-role.yaml
NAME        AGE
test-role   62s
```

作成できた。次にこのRoleと先ほど作成したServiceAccountを紐付けるRoleBindingを作成しよう。以下のManifestを作成した。

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: test-rolebinding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: test-role
subjects:
- apiGroup: ""
  kind: ServiceAccount
  name: test-sa
  namespace: default
```

(こちらも上で上げた例のままだ :sweat_smile:)

それでは上のManifestを適用し、確認しよう。

```plain
$ kubectl apply -f test-rolebinding.yaml
rolebinding.rbac.authorization.k8s.io/test-rolebinding created
$ kubectl get -f test-rolebinding.yaml
NAME               AGE
test-rolebinding   36s
```

作成できた。それでは確認するために適当なPodを作成しておこう。

以下のManifestを作成して適用しよう。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
  - name: nginx
    image: nginx:alpine
  terminationGracePeriodSeconds: 0
```

```plain
$ kubectl apply -f nginx.yaml
pod/nginx created
$ kubectl get po
NAME    READY   STATUS    RESTARTS   AGE
nginx   1/1     Running   0          28s
```

さて、それではServiceAccountを使用するContextに切り替えよう。

```plain
$ kubectl config use-context test-sa-context
Switched to context "test-sa-context".
```

ServiceAccountの認証情報でPodの取得をしてみよう。

```plain
$ kubectl get po
NAME    READY   STATUS    RESTARTS   AGE
nginx   1/1     Running   0          4m4s
```

Podを取得することができた。

今回はPodの取得を許可する簡単なRoleを作成したが、Role / ClusterRoleで指定できるルールは様々なものがあり細かなアクセス制御が可能だ。

リソースの種類についてはKubernetesのOpenAPIのSpecを見るといいだろう。

[kubernetes/api/openapi-spec at master · kubernetes/kubernetes](https://github.com/kubernetes/kubernetes/tree/master/api/openapi-spec)


--------------------------------------------------


というわけで今回はここまで。

次回はCordon / Drain / PodDisruptionBudgetについて見ていこう。

それでは。

